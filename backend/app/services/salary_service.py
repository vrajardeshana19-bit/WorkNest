from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.salary import SalaryStructure
from app.schemas.salary import SalaryStructureCreate, SalaryStructureUpdate


class SalaryService:
    def get_salary_structure(self, db: Session, employee_id: UUID) -> SalaryStructure:
        employee = db.get(Employee, employee_id)
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        salary = db.scalar(select(SalaryStructure).where(SalaryStructure.employee_id == employee_id))
        if not salary:
            salary = SalaryStructure(
                employee_id=employee_id,
                base_salary=Decimal("0.00"),
                hra=Decimal("0.00"),
                standard_allowance=Decimal("0.00"),
                performance_bonus=Decimal("0.00"),
                lta=Decimal("0.00"),
                fixed_allowance=Decimal("0.00"),
                pf_employee=Decimal("0.00"),
                pf_employer=Decimal("0.00"),
                professional_tax=Decimal("0.00"),
            )
            db.add(salary)
            db.commit()
            db.refresh(salary)
        return salary

    def update_salary_structure(
        self, db: Session, employee_id: UUID, payload: SalaryStructureUpdate
    ) -> SalaryStructure:
        salary = self.get_salary_structure(db, employee_id)
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(salary, key, value)
        db.commit()
        db.refresh(salary)
        return salary

    @staticmethod
    def calculate_total_gross(salary: SalaryStructure) -> Decimal:
        return (
            salary.base_salary
            + salary.hra
            + salary.standard_allowance
            + salary.performance_bonus
            + salary.lta
            + salary.fixed_allowance
        )
