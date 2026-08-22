import logging
from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.payroll import (
    PayrollCalculationRequest,
    PayrollProcessAllRequest,
    PayrollResponse,
    PayrollSummaryResponse,
)
from app.services.email_service import get_email_sender
from app.services.payroll_service import PayrollService

router = APIRouter(prefix="/payroll", tags=["payroll"])
payroll_service = PayrollService()
logger = logging.getLogger(__name__)


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


@router.post("/process", response_model=PayrollSummaryResponse)
def process_company_payroll(
    req: PayrollProcessAllRequest,
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> PayrollSummaryResponse:
    company_id = _get_company_id(db, current_user)
    summary = payroll_service.get_company_payroll_summary(db, company_id, req.year, req.month)

    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]
    month_year = f"{month_names[req.month - 1]} {req.year}"
    email_sender = get_email_sender()

    employees_list = db.scalars(
        select(Employee).options(selectinload(Employee.user)).where(Employee.company_id == company_id)
    ).all()
    employees = {emp.id: emp for emp in employees_list}
    notification_emails_sent = 0
    for record in summary.records:
        employee = employees.get(record.employee_id)
        if employee is None or employee.user is None:
            continue
        try:
            email_sender.send_payroll_processed_email(
                to_email=employee.user.email,
                employee_name=record.employee_name or f"{employee.first_name} {employee.last_name}",
                month_year=month_year,
                net_payable=str(record.net_payable),
            )
            notification_emails_sent += 1
        except Exception as exc:
            logger.error(
                "Failed to send payroll email to %s: %s",
                employee.user.email,
                exc,
            )

    return summary.model_copy(update={"notification_emails_sent": notification_emails_sent})


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
