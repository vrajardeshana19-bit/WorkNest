from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import AdminUser
from app.schemas.salary import SalaryStructureResponse, SalaryStructureUpdate
from app.services.salary_service import SalaryService

router = APIRouter(prefix="/salary", tags=["salary"])
salary_service = SalaryService()


@router.get("/{employee_id}", response_model=SalaryStructureResponse)
def get_employee_salary(
    employee_id: UUID,
    _current_user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> SalaryStructureResponse:
    salary = salary_service.get_salary_structure(db, employee_id)
    total_gross = salary_service.calculate_total_gross(salary)
    resp = SalaryStructureResponse.model_validate(salary)
    resp.total_gross = total_gross
    return resp


@router.put("/{employee_id}", response_model=SalaryStructureResponse)
def update_employee_salary(
    employee_id: UUID,
    payload: SalaryStructureUpdate,
    _current_user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> SalaryStructureResponse:
    salary = salary_service.update_salary_structure(db, employee_id, payload)
    total_gross = salary_service.calculate_total_gross(salary)
    resp = SalaryStructureResponse.model_validate(salary)
    resp.total_gross = total_gross
    return resp
