from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.overtime import EmployeeOvertimeDetail, OvertimeSummaryResponse
from app.services.overtime_service import OvertimeService

router = APIRouter(prefix="/overtime", tags=["overtime"])
overtime_service = OvertimeService()


def _get_company_id(db: Session, current_user) -> str:
    if current_user.employee_profile and current_user.employee_profile.company_id:
        return current_user.employee_profile.company_id
    company = db.scalar(select(Company))
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No company found in database")
    return company.id


@router.get("/me", response_model=EmployeeOvertimeDetail)
def get_my_overtime(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> EmployeeOvertimeDetail:
    if not current_user.employee_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return overtime_service.get_employee_overtime(db, current_user.employee_profile)


@router.get("", response_model=OvertimeSummaryResponse)
def get_all_overtime(
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> OvertimeSummaryResponse:
    company_id = _get_company_id(db, current_user)
    return overtime_service.get_all_overtime(db, company_id)


@router.get("/{employee_id}", response_model=EmployeeOvertimeDetail)
def get_employee_overtime(
    employee_id: UUID,
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> EmployeeOvertimeDetail:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return overtime_service.get_employee_overtime(db, employee)
