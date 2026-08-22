from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.auth import BootstrapRequest, BootstrapResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/setup", tags=["setup"])


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
