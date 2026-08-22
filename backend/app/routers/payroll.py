from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.models.company import Company
from app.schemas.payroll import (
    PayrollCalculationRequest,
    PayrollResponse,
    PayrollSummaryResponse,
)
from app.services.payroll_service import PayrollService

router = APIRouter(prefix="/payroll", tags=["payroll"])
payroll_service = PayrollService()


def _get_company_id(db: Session, current_user) -> str:
    if current_user.employee_profile and current_user.employee_profile.company_id:
        return current_user.employee_profile.company_id
    company = db.scalar(select(Company))
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No company found in database")
    return company.id


@router.get("/me", response_model=list[PayrollResponse])
def get_my_payroll_records(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[PayrollResponse]:
    if not current_user.employee_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    records = payroll_service.get_employee_payrolls(db, current_user.employee_profile.id)
    emp_name = f"{current_user.employee_profile.first_name} {current_user.employee_profile.last_name}"

    resps = []
    for rec in records:
        resp = PayrollResponse.model_validate(rec)
        resp.login_id = current_user.employee_profile.employee_id
        resp.employee_name = emp_name
        resp.department = current_user.employee_profile.department
        resps.append(resp)
    return resps


@router.get("", response_model=PayrollSummaryResponse)
def get_company_payroll(
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
) -> PayrollSummaryResponse:
    company_id = _get_company_id(db, current_user)
    return payroll_service.get_company_payroll_summary(db, company_id, year, month)


@router.get("/{employee_id}", response_model=list[PayrollResponse])
def get_employee_payroll(
    employee_id: UUID,
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[PayrollResponse]:
    records = payroll_service.get_employee_payrolls(db, employee_id)
    return [PayrollResponse.model_validate(r) for r in records]


@router.post("/calculate/{employee_id}", response_model=PayrollResponse)
def calculate_employee_payroll(
    employee_id: UUID,
    req: PayrollCalculationRequest,
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> PayrollResponse:
    record = payroll_service.calculate_employee_payroll(db, employee_id, req)
    return PayrollResponse.model_validate(record)
