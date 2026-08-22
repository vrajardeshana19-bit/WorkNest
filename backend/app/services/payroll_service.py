from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import PayrollStatus
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.payroll import PayrollRecord
from app.schemas.payroll import PayrollCalculationRequest, PayrollResponse, PayrollSummaryResponse
from app.services.compliance_service import ComplianceService
from app.services.salary_service import SalaryService


class PayrollService:
    def __init__(
        self,
        salary_service: SalaryService | None = None,
        compliance_service: ComplianceService | None = None,
    ) -> None:
        self.salary_service = salary_service or SalaryService()
        self.compliance_service = compliance_service or ComplianceService()

    def calculate_employee_payroll(
        self,
        db: Session,
        employee_id: UUID,
        req: PayrollCalculationRequest,
    ) -> PayrollRecord:
        employee = db.get(Employee, employee_id)
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        salary = self.salary_service.get_salary_structure(db, employee_id)
        comp_config = self.compliance_service.get_or_create_compliance_config(db, employee.company_id)

        start_date = date(req.year, req.month, 1)
        if req.month == 12:
            end_date = date(req.year + 1, 1, 1)
        else:
            end_date = date(req.year, req.month + 1, 1)

        attendances = db.scalars(
            select(Attendance).where(
                Attendance.employee_id == employee_id,
                Attendance.date >= start_date,
                Attendance.date < end_date,
            )
        ).all()

        total_ot_hours = sum((att.extra_hours or Decimal("0.00") for att in attendances), Decimal("0.00"))

        # Hourly rate calculation assuming 22 working days per month
        std_hours = comp_config.standard_work_hours_per_day
        monthly_std_hours = Decimal("22.00") * std_hours
        if monthly_std_hours > 0:
            hourly_rate = salary.base_salary / monthly_std_hours
        else:
            hourly_rate = Decimal("0.00")

        ot_pay = (total_ot_hours * hourly_rate * comp_config.ot_multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        base_gross = self.salary_service.calculate_total_gross(salary)
        gross_earning = (base_gross + ot_pay).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        daily_rate = (base_gross / Decimal("22.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        unpaid_deduction = (daily_rate * req.unpaid_leave_days).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        total_deductions = (
            unpaid_deduction
            + salary.pf_employee
            + salary.professional_tax
            + req.other_deductions
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        net_payable = max(Decimal("0.00"), gross_earning - total_deductions).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        existing_record = db.scalar(
            select(PayrollRecord).where(
                PayrollRecord.employee_id == employee_id,
                PayrollRecord.year == req.year,
                PayrollRecord.month == req.month,
            )
        )

        if existing_record:
            payroll_rec = existing_record
            payroll_rec.base_salary = salary.base_salary
            payroll_rec.gross_earning = gross_earning
            payroll_rec.overtime_hours = total_ot_hours
            payroll_rec.overtime_pay = ot_pay
            payroll_rec.unpaid_leave_days = req.unpaid_leave_days
            payroll_rec.unpaid_leave_deduction = unpaid_deduction
            payroll_rec.pf_deduction = salary.pf_employee
            payroll_rec.tax_deduction = salary.professional_tax
            payroll_rec.other_deductions = req.other_deductions
            payroll_rec.net_payable = net_payable
            payroll_rec.status = PayrollStatus.PROCESSED
            payroll_rec.processed_at = datetime.now(timezone.utc)
        else:
            payroll_rec = PayrollRecord(
                employee_id=employee_id,
                year=req.year,
                month=req.month,
                base_salary=salary.base_salary,
                gross_earning=gross_earning,
                overtime_hours=total_ot_hours,
                overtime_pay=ot_pay,
                unpaid_leave_days=req.unpaid_leave_days,
                unpaid_leave_deduction=unpaid_deduction,
                pf_deduction=salary.pf_employee,
                tax_deduction=salary.professional_tax,
                other_deductions=req.other_deductions,
                net_payable=net_payable,
                status=PayrollStatus.PROCESSED,
                processed_at=datetime.now(timezone.utc),
            )
            db.add(payroll_rec)

        db.commit()
        db.refresh(payroll_rec)
        return payroll_rec

    def get_employee_payrolls(self, db: Session, employee_id: UUID) -> list[PayrollRecord]:
        return db.scalars(
            select(PayrollRecord)
            .where(PayrollRecord.employee_id == employee_id)
            .order_by(PayrollRecord.year.desc(), PayrollRecord.month.desc())
        ).all()

    def get_company_payroll_summary(
        self, db: Session, company_id: UUID, year: int, month: int
    ) -> PayrollSummaryResponse:
        employees = db.scalars(select(Employee).where(Employee.company_id == company_id)).all()

        payroll_responses: list[PayrollResponse] = []
        total_gross = Decimal("0.00")
        total_net = Decimal("0.00")

        for emp in employees:
            record = db.scalar(
                select(PayrollRecord).where(
                    PayrollRecord.employee_id == emp.id,
                    PayrollRecord.year == year,
                    PayrollRecord.month == month,
                )
            )
            if not record:
                # Auto-calculate if not present
                record = self.calculate_employee_payroll(
                    db,
                    emp.id,
                    PayrollCalculationRequest(year=year, month=month),
                )

            total_gross += record.gross_earning
            total_net += record.net_payable
            emp_name = f"{emp.first_name} {emp.last_name}"

            resp = PayrollResponse.model_validate(record)
            resp.login_id = emp.employee_id
            resp.employee_name = emp_name
            resp.department = emp.department
            payroll_responses.append(resp)

        return PayrollSummaryResponse(
            year=year,
            month=month,
            total_employees_processed=len(payroll_responses),
            total_gross_payout=total_gross,
            total_net_payout=total_net,
            records=payroll_responses,
        )
