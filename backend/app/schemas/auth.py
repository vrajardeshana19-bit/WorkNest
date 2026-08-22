from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.enums import EmployeeDisplayStatus, Role


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10)


class VerifyEmailResponse(BaseModel):
    message: str
    is_verified: bool


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordResponse(BaseModel):
    message: str
    must_change_password: bool


class UserResponse(BaseModel):
    id: UUID
    employee_id: str
    email: EmailStr
    role: Role
    is_verified: bool
    is_active: bool
    must_change_password: bool
    display_status: EmployeeDisplayStatus | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BootstrapRequest(BaseModel):
    company_name: str = Field(..., min_length=1)
    company_initials: str = Field(..., min_length=2, max_length=10)
    admin_email: EmailStr
    admin_first_name: str = Field(..., min_length=1)
    admin_last_name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8, max_length=128)


class BootstrapResponse(BaseModel):
    message: str
    admin_login_id: str
    admin_email: EmailStr
