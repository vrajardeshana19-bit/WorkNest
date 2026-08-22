from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.enums import EmployeeDisplayStatus, Role


class CompanyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    initials: str = Field(..., min_length=2, max_length=10)
    logo_url: str | None = None


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    initials: str
    logo_url: str | None

    model_config = {"from_attributes": True}


class EmployeeCreateRequest(BaseModel):
    company_id: UUID
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    date_of_joining: date
    department: str | None = Field(default=None, max_length=100)
    designation: str | None = Field(default=None, max_length=100)
    role: Role = Role.EMPLOYEE


class EmployeeCreateResponse(BaseModel):
    id: UUID
    login_id: str
    email: EmailStr
    role: Role
    first_name: str
    last_name: str
    message: str
    temporary_password: str | None = None


class EmployeeProfileUpdateRequest(BaseModel):
    phone: str | None = None
    address: str | None = None
    about: str | None = None
    job_love: str | None = None
    interests: str | None = None
    skills: str | None = None
    certifications: str | None = None
    date_of_birth: date | None = None
    mailing_address: str | None = None
    personal_email: EmailStr | None = None
    gender: str | None = None
    marital_status: str | None = None
    bank_account_number: str | None = None
    bank_name: str | None = None
    ifsc_code: str | None = None
    pan_no: str | None = None
    uid_no: str | None = None
    profile_picture: str | None = None


class EmployeeResponse(BaseModel):
    id: UUID
    login_id: str
    email: EmailStr
    role: Role
    first_name: str
    last_name: str
    phone: str | None
    department: str | None
    designation: str | None
    profile_picture: str | None
    date_of_joining: date
    company: CompanyResponse
    display_status: EmployeeDisplayStatus
    about: str | None = None
    job_love: str | None = None
    interests: str | None = None
    skills: str | None = None
    certifications: str | None = None
    date_of_birth: date | None = None
    mailing_address: str | None = None
    personal_email: EmailStr | None = None
    gender: str | None = None
    marital_status: str | None = None
    bank_account_number: str | None = None
    bank_name: str | None = None
    ifsc_code: str | None = None
    pan_no: str | None = None
    uid_no: str | None = None
    emp_code: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListItem(BaseModel):
    id: UUID
    login_id: str
    first_name: str
    last_name: str
    department: str | None
    profile_picture: str | None
    display_status: EmployeeDisplayStatus
