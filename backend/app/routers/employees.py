from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.schemas.employee import (
    CompanyCreateRequest,
    CompanyResponse,
    EmployeeCreateRequest,
    EmployeeCreateResponse,
    EmployeeListItem,
    EmployeeProfileUpdateRequest,
    EmployeeResponse,
)
from app.services.employee_service import employee_service
from app.services.employee_status_service import get_employee_display_status

router = APIRouter(prefix="/employees", tags=["employees"])


def _to_employee_response(db: Session, employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=employee.id,
        login_id=employee.employee_id,
        email=employee.user.email,
        role=employee.user.role,
        first_name=employee.first_name,
        last_name=employee.last_name,
        phone=employee.phone,
        department=employee.department,
        designation=employee.designation,
        profile_picture=employee.profile_picture,
        date_of_joining=employee.date_of_joining,
        company=CompanyResponse.model_validate(employee.company),
        display_status=get_employee_display_status(db, employee),
        about=employee.about,
        job_love=employee.job_love,
        interests=employee.interests,
        skills=employee.skills,
        certifications=employee.certifications,
        date_of_birth=employee.date_of_birth,
        mailing_address=employee.mailing_address,
        personal_email=employee.personal_email,
        gender=employee.gender,
        marital_status=employee.marital_status,
        bank_account_number=employee.bank_account_number,
        bank_name=employee.bank_name,
        ifsc_code=employee.ifsc_code,
        pan_no=employee.pan_no,
        uid_no=employee.uid_no,
        emp_code=employee.emp_code,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
) -> CompanyResponse:
    company = employee_service.create_company(
        db,
        name=payload.name,
        initials=payload.initials,
        logo_url=payload.logo_url,
    )
    db.commit()
    db.refresh(company)
    return CompanyResponse.model_validate(company)


@router.post("", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
) -> EmployeeCreateResponse:
    user, employee, debug_password, credentials_email_sent = employee_service.create_employee(
        db,
        company_id=payload.company_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=str(payload.email),
        phone=payload.phone,
        date_of_joining=payload.date_of_joining,
        department=payload.department,
        designation=payload.designation,
        role=payload.role,
    )
    db.commit()
    db.refresh(employee)

    if credentials_email_sent:
        message = f"Employee created. Login credentials emailed to {user.email}."
    else:
        message = "Employee created. Email delivery failed — share credentials manually."

    return EmployeeCreateResponse(
        id=employee.id,
        login_id=user.employee_id,
        email=user.email,
        role=user.role,
        first_name=employee.first_name,
        last_name=employee.last_name,
        message=message,
        temporary_password=debug_password,
        credentials_email_sent=credentials_email_sent,
    )


@router.get("", response_model=list[EmployeeListItem])
def list_employees(
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
) -> list[EmployeeListItem]:
    employees = employee_service.list_employees(db)
    return [
        EmployeeListItem(
            id=employee.id,
            login_id=employee.employee_id,
            first_name=employee.first_name,
            last_name=employee.last_name,
            department=employee.department,
            profile_picture=employee.profile_picture,
            display_status=get_employee_display_status(db, employee),
        )
        for employee in employees
    ]


@router.get("/me", response_model=EmployeeResponse)
def get_my_profile(
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
) -> EmployeeResponse:
    employee = employee_service.get_employee_by_user(db, current_user.id)
    return _to_employee_response(db, employee)


@router.patch("/me", response_model=EmployeeResponse)
def update_my_profile(
    payload: EmployeeProfileUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
) -> EmployeeResponse:
    employee = employee_service.get_employee_by_user(db, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    employee_service.update_own_profile(db, employee, updates)
    db.commit()
    db.refresh(employee)
    return _to_employee_response(db, employee)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
) -> EmployeeResponse:
    employee = employee_service.get_employee(db, employee_id)
    if current_user.role.value == "EMPLOYEE" and employee.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return _to_employee_response(db, employee)
