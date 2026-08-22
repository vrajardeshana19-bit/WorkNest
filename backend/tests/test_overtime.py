import uuid
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import AttendanceStatus, Role
from app.core.security import hash_password
from app.models.attendance import Attendance
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User


def _setup_overtime_data(db_session: Session) -> tuple[User, User, Employee, Company]:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Overtime Co {suffix}", initials="OC")
    admin_user = User(
        employee_id=f"OCADMIN{suffix[:4]}",
        email=f"admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
    )
    emp_user = User(
        employee_id=f"OCEMP{suffix[:4]}",
        email=f"emp-{suffix}@example.com",
        password_hash=hash_password("emppass123"),
        role=Role.EMPLOYEE,
        is_verified=True,
        is_active=True,
    )
    db_session.add_all([company, admin_user, emp_user])
    db_session.flush()

    admin_employee = Employee(
        user=admin_user,
        company_id=company.id,
        employee_id=admin_user.employee_id,
        first_name="Admin",
        last_name="User",
        date_of_joining=date(2025, 1, 1),
    )
    db_session.add(admin_employee)
    db_session.flush()

    employee = Employee(

        user=emp_user,
        company_id=company.id,
        employee_id=emp_user.employee_id,
        first_name="Overtime",
        last_name="Worker",
        date_of_joining=date(2025, 1, 1),
    )
    db_session.add(employee)
    db_session.flush()

    # Add attendance with extra hours
    today = date.today()
    att = Attendance(
        employee_id=employee.id,
        date=today,
        total_hours=Decimal("10.00"),
        extra_hours=Decimal("2.00"),
        status=AttendanceStatus.COMPLETE,
    )
    db_session.add(att)
    db_session.flush()

    return admin_user, emp_user, employee, company


def _login(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_overtime_endpoints(client: TestClient, db_session: Session):
    admin, emp_user, employee, _ = _setup_overtime_data(db_session)
    emp_token = _login(client, emp_user.email, "emppass123")
    admin_token = _login(client, admin.email, "adminpass123")

    # Employee views own overtime
    resp = client.get("/api/v1/overtime/me", headers={"Authorization": f"Bearer {emp_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["daily_extra_hours_today"] == "2.00"

    # Admin views company overtime summary
    resp = client.get("/api/v1/overtime", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_employees_with_ot"] >= 1
