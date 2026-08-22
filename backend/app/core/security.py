import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.config import get_settings
from app.core.enums import Role


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(*, user_id: UUID, role: Role) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


def generate_temp_password() -> str:
    return secrets.token_urlsafe(10)


def hash_verification_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class TokenValidationError(Exception):
    pass


def get_token_subject(token: str) -> tuple[UUID, Role]:
    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["sub"])
        role = Role(payload["role"])
    except (JWTError, KeyError, ValueError) as exc:
        raise TokenValidationError("Invalid or expired token") from exc
    return user_id, role
