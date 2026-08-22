from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import (
    create_access_token,
    hash_password,
    hash_verification_token,
    verify_password,
)
from app.models.email_verification import EmailVerificationToken
from app.models.user import User
from app.services.email_service import EmailSender, get_email_sender


class AuthService:
    def __init__(self, email_sender: EmailSender | None = None) -> None:
        self.email_sender = email_sender or get_email_sender()

    def verify_email(self, db: Session, *, token: str) -> User:
        token_hash = hash_verification_token(token.strip())
        record = db.scalar(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash == token_hash
            )
        )
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )
        if record.used_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has already been used",
            )
        if record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired",
            )

        user = db.get(User, record.user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )

        user.is_verified = True
        record.used_at = datetime.now(timezone.utc)
        db.flush()
        return user

    def login(self, db: Session, *, login_id_or_email: str, password: str) -> tuple[User, str]:
        identifier = login_id_or_email.strip()
        normalized_email = identifier.lower()

        user = db.scalar(
            select(User).where(
                or_(
                    User.email == normalized_email,
                    User.employee_id == identifier.upper(),
                    User.employee_id == identifier,
                )
            )
        )
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Login ID/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is not verified",
            )

        access_token = create_access_token(user_id=user.id, role=user.role)
        return user, access_token

    def change_password(
        self,
        db: Session,
        *,
        user: User,
        current_password: str,
        new_password: str,
    ) -> User:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        user.password_hash = hash_password(new_password)
        user.must_change_password = False
        db.flush()
        return user

    def get_user_by_id(self, db: Session, user_id) -> User | None:
        return db.get(User, user_id)

    def bootstrap_admin(
        self,
        db: Session,
        *,
        company_name: str,
        company_initials: str,
        admin_email: str,
        admin_first_name: str,
        admin_last_name: str,
        password: str,
    ) -> User:
        if db.scalar(select(func.count()).select_from(User)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="System is already initialized",
            )

        from app.models.company import Company

        company = Company(
            name=company_name.strip(),
            initials=company_initials.strip().upper(),
        )
        db.add(company)
        db.flush()

        login_id = f"{company.initials}ADMIN{datetime.now(timezone.utc).year}0001"
        user = User(
            employee_id=login_id,
            email=admin_email.strip().lower(),
            password_hash=hash_password(password),
            role=Role.ADMIN,
            is_verified=True,
            is_active=True,
            must_change_password=False,
        )
        db.add(user)
        db.flush()
        return user


auth_service = AuthService()
