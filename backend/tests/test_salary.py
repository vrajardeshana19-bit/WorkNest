import uuid
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import hash_password
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User


def _setup_users(db_session: Session) -> tuple[User, User, Employee, Company]:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Salary Co {suffix}", initials="SC")
    admin_user = User(
        employee_id=f"SCADMIN{suffix[:4]}",
        email=f"admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
    )
    emp_user = User(
        employee_id=f"SCEMP{suffix[:4]}",
        email=f"emp-{suffix}@example.com",
        password_hash=hash_password("emppass123"),
        role=Role.EMPLOYEE,
        is_verified=True,
        is_active=True,
    )
    db_session.add_all([company, admin_user, emp_user])
    db_session.flush()

    employee = Employee(
        user=emp_user,
        company_id=company.id,
        employee_id=emp_user.employee_id,
        first_name="Test",
        last_name="Employee",
        date_of_joining=date(2025, 1, 1),
    )
    db_session.add(employee)
    db_session.flush()
    return admin_user, emp_user, employee, company


def _login(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_salary_admin_only(client: TestClient, db_session: Session):
    admin, emp_user, employee, _ = _setup_users(db_session)
    admin_token = _login(client, admin.email, "adminpass123")
    emp_token = _login(client, emp_user.email, "emppass123")

    # Non-admin should be forbidden (403)
    resp = client.get(
        f"/api/v1/salary/{employee.id}",
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert resp.status_code == 403

    # Admin gets salary structure
    resp = client.get(
        f"/api/v1/salary/{employee.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["employee_id"] == str(employee.id)

    # Admin updates salary structure
    update_payload = {
        "base_salary": "50000.00",
        "hra": "15000.00",
        "fixed_allowance": "5000.00",
        "pf_employee": "1800.00",
        "professional_tax": "200.00",
    }
    resp = client.put(
        f"/api/v1/salary/{employee.id}",
        json=update_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    updated_data = resp.json()
    assert updated_data["base_salary"] == "50000.00"
    assert updated_data["total_gross"] == "70000.00"
