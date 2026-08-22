import uuid
from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import hash_password
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User


def _create_employee_user(db_session: Session) -> tuple[User, Employee, Company]:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Attendance Co {suffix}", initials="AC")
    admin = User(
        employee_id=f"ACADMIN{suffix[:4]}",
        email=f"admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
    )
    db_session.add_all([company, admin])
    db_session.flush()

    login_id = f"ACJOJO2025{suffix[:4]}"
    user = User(
        employee_id=login_id,
        email=f"employee-{suffix}@example.com",
        password_hash=hash_password("temppass123"),
        role=Role.EMPLOYEE,
        is_verified=True,
        is_active=True,
        must_change_password=False,
    )
    employee = Employee(
        user=user,
        company_id=company.id,
        employee_id=login_id,
        first_name="John",
        last_name="Jordan",
        date_of_joining=date(2025, 1, 1),
        department="Engineering",
    )
    db_session.add_all([user, employee])
    db_session.flush()
    return user, employee, company


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_check_in_check_out_and_monthly_view(client: TestClient, db_session: Session) -> None:
    user, _employee, _company = _create_employee_user(db_session)
    token = _login(client, user.email, "temppass123")
    headers = {"Authorization": f"Bearer {token}"}

    check_in = client.post("/api/v1/attendance/check-in", headers=headers)
    assert check_in.status_code == 201
    assert check_in.json()["status"] == "CHECKED_IN"
    assert check_in.json()["check_in_time"] is not None

    today = client.get("/api/v1/attendance/me/today", headers=headers)
    assert today.status_code == 200
    assert today.json()["is_checked_in"] is True
    assert today.json()["since"] is not None

    duplicate = client.post("/api/v1/attendance/check-in", headers=headers)
    assert duplicate.status_code == 409

    check_out = client.post("/api/v1/attendance/check-out", headers=headers)
    assert check_out.status_code == 200
    assert check_out.json()["status"] == "COMPLETE"
    assert check_out.json()["work_hours"] is not None

    monthly = client.get("/api/v1/attendance/me", headers=headers)
    assert monthly.status_code == 200
    body = monthly.json()
    assert body["summary"]["days_present"] >= 1
    assert body["summary"]["leaves_count"] == 0
    assert body["summary"]["total_working_days"] >= 1
    assert len(body["records"]) >= 1


def test_admin_daily_attendance_view(client: TestClient, db_session: Session) -> None:
    user, _employee, _company = _create_employee_user(db_session)
    employee_token = _login(client, user.email, "temppass123")
    client.post(
        "/api/v1/attendance/check-in",
        headers={"Authorization": f"Bearer {employee_token}"},
    )

    admin = db_session.query(User).filter(User.role == Role.ADMIN, User.email == _company.name).first() or db_session.query(User).filter(User.role == Role.ADMIN).first()

    admin_token = _login(client, admin.email, "adminpass123")
    response = client.get(
        "/api/v1/attendance",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "records" in payload
    assert any(row["login_id"] == user.employee_id for row in payload["records"])
