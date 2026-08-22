from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import TokenValidationError, get_token_subject
from app.database import get_db
from app.models.user import User
from app.services.auth_service import auth_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        user_id, _role = get_token_subject(token)
    except TokenValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    return user


def require_roles(*allowed_roles: Role) -> Callable:
    def dependency(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


require_employee = require_roles(Role.EMPLOYEE)
require_hr = require_roles(Role.HR)
require_admin = require_roles(Role.ADMIN)
require_hr_or_admin = require_roles(Role.HR, Role.ADMIN)

CurrentUser = Annotated[User, Depends(get_current_user)]
EmployeeUser = Annotated[User, Depends(require_employee)]
HrUser = Annotated[User, Depends(require_hr)]
AdminUser = Annotated[User, Depends(require_admin)]
HrOrAdminUser = Annotated[User, Depends(require_hr_or_admin)]
