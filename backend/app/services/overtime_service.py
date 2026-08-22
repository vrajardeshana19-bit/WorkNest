from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ComplianceStatus
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.schemas.overtime import EmployeeOvertimeDetail, OvertimeDailyRecord, OvertimeSummaryResponse
from app.services.compliance_service import ComplianceService


class OvertimeService:
    def __init__(self, compliance_service: ComplianceService | None = None) -> None:
        self.compliance_service = compliance_service or ComplianceService()

    def get_employee_overtime(
        self, db: Session, employee: Employee, target_date: date | None = None
    ) -> EmployeeOvertimeDetail:
        target_date = target_date or date.today()
        comp_config = self.compliance_service.get_or_create_compliance_config(db, employee.company_id)

        # Get records for current month
        start_of_month = date(target_date.year, target_date.month, 1)
        if target_date.month == 12:
            next_month = date(target_date.year + 1, 1, 1)
        else:
            next_month = date(target_date.year, target_date.month + 1, 1)

        attendances = db.scalars(
            select(Attendance)
            .where(
                Attendance.employee_id == employee.id,
                Attendance.date >= start_of_month,
                Attendance.date < next_month,
            )
            .order_by(Attendance.date.desc())
        ).all()

        daily_records: list[OvertimeDailyRecord] = []
        monthly_extra = Decimal("0.00")
        today_extra = Decimal("0.00")
        today_work_hours = Decimal("0.00")

        for att in attendances:
            work_h = att.total_hours or Decimal("0.00")
            extra_h = att.extra_hours or Decimal("0.00")
            monthly_extra += extra_h

            if att.date == target_date:
                today_extra = extra_h
                today_work_hours = work_h

            daily_records.append(
                OvertimeDailyRecord(
                    date=att.date.isoformat(),
                    work_hours=work_h,
                    extra_hours=extra_h,
                    status=att.status.value,
                )
            )

        # Calculate weekly extra hours (last 7 days up to target_date)
        week_start = target_date - timedelta(days=6)
        weekly_attendances = db.scalars(
            select(Attendance).where(
                Attendance.employee_id == employee.id,
                Attendance.date >= week_start,
                Attendance.date <= target_date,
            )
        ).all()
        weekly_extra = sum((att.extra_hours or Decimal("0.00") for att in weekly_attendances), Decimal("0.00"))

        # Calculate quarterly extra hours (current 3-month quarter)
        quarter = (target_date.month - 1) // 3 + 1
        q_start_month = (quarter - 1) * 3 + 1
        q_start = date(target_date.year, q_start_month, 1)
        quarterly_attendances = db.scalars(
            select(Attendance).where(
                Attendance.employee_id == employee.id,
                Attendance.date >= q_start,
                Attendance.date <= target_date,
            )
        ).all()
        quarterly_extra = sum((att.extra_hours or Decimal("0.00") for att in quarterly_attendances), Decimal("0.00"))

        comp_status, _ = self.compliance_service.evaluate_compliance_status(
            daily_hours=today_work_hours,
            weekly_ot=weekly_extra,
            quarterly_ot=quarterly_extra,
            config=comp_config,
        )

        emp_name = f"{employee.first_name} {employee.last_name}"

        return EmployeeOvertimeDetail(
            employee_id=employee.id,
            login_id=employee.employee_id,
            employee_name=emp_name,
            department=employee.department,
            daily_extra_hours_today=today_extra,
            weekly_extra_hours=weekly_extra,
            monthly_extra_hours=monthly_extra,
            quarterly_extra_hours=quarterly_extra,
            compliance_status=comp_status,
            records=daily_records,
        )

    def get_all_overtime(self, db: Session, company_id: UUID, target_date: date | None = None) -> OvertimeSummaryResponse:
        employees = db.scalars(select(Employee).where(Employee.company_id == company_id)).all()

        total_extra_month = Decimal("0.00")
        ot_details: list[EmployeeOvertimeDetail] = []
        employees_with_ot_count = 0

        for emp in employees:
            detail = self.get_employee_overtime(db, emp, target_date)
            if detail.monthly_extra_hours > 0 or detail.daily_extra_hours_today > 0:
                employees_with_ot_count += 1
            total_extra_month += detail.monthly_extra_hours
            ot_details.append(detail)

        return OvertimeSummaryResponse(
            total_employees_with_ot=employees_with_ot_count,
            total_extra_hours_this_month=total_extra_month,
            overtime_records=ot_details,
        )
