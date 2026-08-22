from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.auth import BootstrapRequest, BootstrapResponse
from app.services.auth_service import auth_service
from app.services.demo_seed_service import demo_seed_service
from app.services.email_service import get_email_sender

router = APIRouter(prefix="/setup", tags=["setup"])


class SeedDemoResponse(BaseModel):
    message: str
    holidays_added: int
    salaries_updated: int
    payroll_records_processed: int


class TestEmailRequest(BaseModel):
    to_email: str


class TestEmailResponse(BaseModel):
    message: str
    provider: str
    to_email: str


@router.post("/bootstrap", response_model=BootstrapResponse, status_code=status.HTTP_201_CREATED)
def bootstrap_system(
    payload: BootstrapRequest,
    db: Annotated[Session, Depends(get_db)],
) -> BootstrapResponse:
    settings = get_settings()
    if settings.app_env not in {"development", "test"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bootstrap is only allowed in development",
        )

    user = auth_service.bootstrap_admin(
        db,
        company_name=payload.company_name,
        company_initials=payload.company_initials,
        admin_email=str(payload.admin_email),
        admin_first_name=payload.admin_first_name,
        admin_last_name=payload.admin_last_name,
        password=payload.password,
    )
    db.commit()
    return BootstrapResponse(
        message="System initialized with admin account",
        admin_login_id=user.employee_id,
        admin_email=user.email,
    )


@router.post("/seed-demo", response_model=SeedDemoResponse)
def seed_demo_data(
    db: Annotated[Session, Depends(get_db)],
) -> SeedDemoResponse:
    settings = get_settings()
    if settings.app_env not in {"development", "test"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo seed is only allowed in development",
        )

    try:
        result = demo_seed_service.seed(db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return SeedDemoResponse(**result)


@router.post("/test-email", response_model=TestEmailResponse)
def send_test_email(payload: TestEmailRequest) -> TestEmailResponse:
    settings = get_settings()
    sender = get_email_sender()
    try:
        sender.send_test_email(to_email=payload.to_email.strip())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return TestEmailResponse(
        message="Test email sent successfully",
        provider=settings.email_provider,
        to_email=payload.to_email.strip(),
    )
