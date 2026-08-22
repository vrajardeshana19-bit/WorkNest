import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User


@pytest.fixture
def admin_token(client: TestClient, db_session: Session) -> str:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Holiday Co {suffix}", initials="HC")
    admin = User(
        employee_id=f"HCADMIN{suffix[:4]}",
        email=f"holiday-admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
    )
    db_session.add_all([company, admin])
    db_session.flush()

    response = client.post(
        "/api/v1/auth/login",
        data={"username": admin.email, "password": "adminpass123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_holiday_crud(client: TestClient, admin_token: str) -> None:
    headers = {"Authorization": f"Bearer {admin_token}"}

    create = client.post(
        "/api/v1/holidays",
        headers=headers,
        json={"name": "Diwali", "date": "2026-11-08", "description": "Festival"},
    )
    assert create.status_code == 201
    holiday_id = create.json()["id"]

    listing = client.get("/api/v1/holidays?year=2026", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) >= 1

    update = client.patch(
        f"/api/v1/holidays/{holiday_id}",
        headers=headers,
        json={"description": "Updated description"},
    )
    assert update.status_code == 200
    assert update.json()["description"] == "Updated description"

    delete = client.delete(f"/api/v1/holidays/{holiday_id}", headers=headers)
    assert delete.status_code == 204
