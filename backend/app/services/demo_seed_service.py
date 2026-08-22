"""Seed demo data for sales demos — holidays, salaries, payroll."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.employee import Employee
from app.models.holiday import Holiday
from app.models.salary import SalaryStructure
from app.schemas.payroll import PayrollCalculationRequest
from app.services.payroll_service import PayrollService


DEFAULT_HOLIDAYS_2026 = [
    ("Republic Day", date(2026, 1, 26)),
    ("Holi", date(2026, 3, 17)),
    ("Independence Day", date(2026, 8, 15)),
    ("Gandhi Jayanti", date(2026, 10, 2)),
    ("Diwali", date(2026, 11, 8)),
    ("Christmas", date(2026, 12, 25)),
]


def _apply_default_salary(salary: SalaryStructure, monthly_wage: Decimal = Decimal("50000")) -> None:
    basic = (monthly_wage * Decimal("0.5")).quantize(Decimal("0.01"))
    hra = (basic * Decimal("0.5")).quantize(Decimal("0.01"))
    standard = Decimal("4167.00")
    performance = (monthly_wage * Decimal("0.0833")).quantize(Decimal("0.01"))
    lta = (monthly_wage * Decimal("0.08333")).quantize(Decimal("0.01"))
    fixed = max(Decimal("0"), monthly_wage - (basic + hra + standard + performance + lta)).quantize(
        Decimal("0.01")
    )
    pf = (basic * Decimal("0.12")).quantize(Decimal("0.01"))

    salary.base_salary = basic
    salary.hra = hra
    salary.standard_allowance = standard
    salary.performance_bonus = performance
    salary.lta = lta
    salary.fixed_allowance = fixed
    salary.pf_employee = pf
    salary.pf_employer = pf
    salary.professional_tax = Decimal("200.00")


class DemoSeedService:
    def __init__(self) -> None:
        self.payroll_service = PayrollService()

    def seed(self, db: Session) -> dict:
        company = db.scalar(select(Company))
        if company is None:
            raise ValueError("No company found. Run bootstrap first.")

        holidays_added = self._seed_holidays(db)
        salaries_updated = self._seed_salaries(db)
        payroll_processed = self._seed_payroll(db, company.id)

        db.commit()

        return {
            "message": "Demo data seeded successfully",
            "holidays_added": holidays_added,
            "salaries_updated": salaries_updated,
            "payroll_records_processed": payroll_processed,
        }

    def _seed_holidays(self, db: Session) -> int:
        added = 0
        for name, holiday_date in DEFAULT_HOLIDAYS_2026:
            exists = db.scalar(select(Holiday).where(Holiday.date == holiday_date))
            if exists:
                continue
            db.add(Holiday(name=name, date=holiday_date, description=f"Company holiday — {name}"))
            added += 1
        db.flush()
        return added

    def _seed_salaries(self, db: Session) -> int:
        updated = 0
        employees = db.scalars(select(Employee)).all()
        for employee in employees:
            salary = db.scalar(select(SalaryStructure).where(SalaryStructure.employee_id == employee.id))
            if salary is None:
                salary = SalaryStructure(employee_id=employee.id)
                db.add(salary)
            if salary.base_salary and salary.base_salary > 0:
                continue
            _apply_default_salary(salary)
            updated += 1
        db.flush()
        return updated

    def _seed_payroll(self, db: Session, company_id) -> int:
        today = date.today()
        summary = self.payroll_service.get_company_payroll_summary(
            db, company_id, today.year, today.month
        )
        return summary.total_employees_processed


demo_seed_service = DemoSeedService()
