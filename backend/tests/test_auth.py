from datetime import date
import re
import uuid

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.dependencies.auth import require_admin, require_employee, require_hr, require_hr_or_admin
from app.models.user import User
from app.services.login_id_service import generate_login_id


def test_app_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app"] == "dayflow"


def test_login_id_generation_format() -> None:
    login_id = generate_login_id(
        company_initials="OI",
        first_name="John",
        last_name="Doe",
        date_of_joining=date(2022, 1, 1),
        serial=1,
    )
    assert login_id == "OIJODO20220001"


def _bootstrap_admin(client: TestClient) -> dict:
    response = client.post(
        "/api/v1/setup/bootstrap",
        json={
            "company_name": "Odoo India",
            "company_initials": "OI",
            "admin_email": "admin@example.com",
            "admin_first_name": "System",
            "admin_last_name": "Admin",
            "password": "adminpass123",
        },
    )
    if response.status_code == 409:
        return {"admin_email": "admin@example.com", "admin_login_id": "OIADMIN20260001"}
    assert response.status_code == 201, response.text
    return response.json()


def _login(client: TestClient, *, username: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "access_token" in payload
    return payload["access_token"]


def test_hr_creates_employee_and_employee_logs_in_with_login_id(client: TestClient, db_session: Session) -> None:
    from app.core.enums import Role
    from app.core.security import hash_password
    from app.models.company import Company
    from app.models.user import User

    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Odoo India {suffix}", initials="OI")
    admin = User(
        employee_id=f"OIADMIN2026{suffix[:4]}",
        email=f"admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
        must_change_password=False,
    )
    db_session.add_all([company, admin])
    db_session.flush()

    admin_token = _login(client, username=admin.email, password="adminpass123")

    create_response = client.post(
        "/api/v1/employees",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "company_id": str(company.id),
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe.unique@example.com",
            "phone": "9999999999",
            "date_of_joining": "2022-01-15",
            "department": "Engineering",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert re.fullmatch(r"OIJODO2022\d{4}", created["login_id"])
    assert created["temporary_password"]

    temp_password = created["temporary_password"]
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": created["login_id"], "password": temp_password},
    )
    assert login_response.status_code == 200
    assert login_response.json()["must_change_password"] is True

    employee_token = login_response.json()["access_token"]
    change_response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {employee_token}"},
        json={
            "current_password": temp_password,
            "new_password": "newsecure123",
        },
    )
    assert change_response.status_code == 200
    assert change_response.json()["must_change_password"] is False

    relogin = client.post(
        "/api/v1/auth/login",
        data={"username": "john.doe.unique@example.com", "password": "newsecure123"},
    )
    assert relogin.status_code == 200

    me_response = client.get(
        "/api/v1/employees/me",
        headers={"Authorization": f"Bearer {relogin.json()['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["login_id"] == created["login_id"]


def test_public_register_removed(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "employee_id": "EMP-X",
            "email": "self@example.com",
            "password": "securepass123",
            "role": "EMPLOYEE",
        },
    )
    assert response.status_code == 404


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_role_dependencies() -> None:
    employee = User(
        employee_id="EMP-RBAC-1",
        email="employee-rbac@example.com",
        password_hash="hash",
        role=Role.EMPLOYEE,
    )
    hr_user = User(
        employee_id="EMP-RBAC-2",
        email="hr-rbac@example.com",
        password_hash="hash",
        role=Role.HR,
    )
    admin_user = User(
        employee_id="EMP-RBAC-3",
        email="admin-rbac@example.com",
        password_hash="hash",
        role=Role.ADMIN,
    )

    assert require_employee(employee).role == Role.EMPLOYEE
    assert require_hr(hr_user).role == Role.HR
    assert require_admin(admin_user).role == Role.ADMIN
    assert require_hr_or_admin(hr_user).role == Role.HR
    assert require_hr_or_admin(admin_user).role == Role.ADMIN

    with pytest.raises(HTTPException) as employee_hr_exc:
        require_hr(employee)
    assert employee_hr_exc.value.status_code == 403

    with pytest.raises(HTTPException) as employee_admin_exc:
        require_admin(employee)
    assert employee_admin_exc.value.status_code == 403
