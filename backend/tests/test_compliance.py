import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import hash_password
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User


def _setup_admin(db_session: Session) -> tuple[User, Company]:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Compliance Co {suffix}", initials="CC")
    admin_user = User(
        employee_id=f"CCADMIN{suffix[:4]}",
        email=f"admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
    )
    db_session.add_all([company, admin_user])
    db_session.flush()

    employee = Employee(
        user=admin_user,
        company_id=company.id,
        employee_id=admin_user.employee_id,
        first_name="Admin",
        last_name="User",
        date_of_joining=date(2025, 1, 1),
    )
    db_session.add(employee)
    db_session.flush()
    return admin_user, company


def _login(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_compliance_config_and_alerts(client: TestClient, db_session: Session):
    admin, company = _setup_admin(db_session)
    token = _login(client, admin.email, "adminpass123")

    # Get default config
    resp = client.get("/api/v1/compliance/config", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["daily_limit_hours"] == "10.00"
    assert data["ot_multiplier"] == "2.00"

    # Update config
    update_payload = {"daily_limit_hours": "12.00", "ot_multiplier": "2.50"}
    resp = client.put("/api/v1/compliance/config", json=update_payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["daily_limit_hours"] == "12.00"
    assert resp.json()["ot_multiplier"] == "2.50"

    # Check alerts
    resp = client.get("/api/v1/compliance/alerts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "alerts" in resp.json()
