from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.auth import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.services.auth_service import auth_service
from app.services.employee_status_service import get_current_user_display_status

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(
    payload: VerifyEmailRequest,
    db: Annotated[Session, Depends(get_db)],
) -> VerifyEmailResponse:
    user = auth_service.verify_email(db, token=payload.token)
    db.commit()
    return VerifyEmailResponse(message="Email verified successfully", is_verified=user.is_verified)


@router.post("/resend-verification", response_model=ResendVerificationResponse)
def resend_verification_email(
    payload: ResendVerificationRequest,
    db: Annotated[Session, Depends(get_db)],
) -> ResendVerificationResponse:
    try:
        auth_service.resend_verification_email(db, email=str(payload.email))
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send verification email: {exc}",
        ) from exc

    return ResendVerificationResponse(message="Verification email sent. Check your inbox.")


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    user, access_token = auth_service.login(
        db,
        login_id_or_email=form_data.username,
        password=form_data.password,
    )
    return TokenResponse(
        access_token=access_token,
        must_change_password=user.must_change_password,
    )


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
) -> ChangePasswordResponse:
    user = auth_service.change_password(
        db,
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    db.commit()
    return ChangePasswordResponse(
        message="Password updated successfully",
        must_change_password=user.must_change_password,
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        employee_id=current_user.employee_id,
        email=current_user.email,
        role=current_user.role,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        must_change_password=current_user.must_change_password,
        display_status=get_current_user_display_status(db, current_user),
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
