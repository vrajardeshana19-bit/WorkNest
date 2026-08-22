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
from app.models.salary import SalaryStructure
from app.models.user import User


def _setup_payroll_data(db_session: Session) -> tuple[User, User, Employee, Company]:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Payroll Co {suffix}", initials="PC")
    admin_user = User(
        employee_id=f"PCADMIN{suffix[:4]}",
        email=f"admin-{suffix}@example.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
        is_verified=True,
        is_active=True,
    )
    emp_user = User(
        employee_id=f"PCEMP{suffix[:4]}",
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
        first_name="Payroll",
        last_name="Subject",
        date_of_joining=date(2025, 1, 1),
    )
    db_session.add(employee)
    db_session.flush()

    salary = SalaryStructure(
        employee_id=employee.id,
        base_salary=Decimal("44000.00"),  # Hourly rate: 44000 / (22 * 8) = 250
        hra=Decimal("10000.00"),
        pf_employee=Decimal("1800.00"),
        professional_tax=Decimal("200.00"),
    )
    db_session.add(salary)
    db_session.flush()

    return admin_user, emp_user, employee, company


def _login(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_payroll_calculation_and_fetch(client: TestClient, db_session: Session):
    admin, emp_user, employee, _ = _setup_payroll_data(db_session)
    admin_token = _login(client, admin.email, "adminpass123")
    emp_token = _login(client, emp_user.email, "emppass123")

    today = date.today()
    calc_payload = {
        "year": today.year,
        "month": today.month,
        "unpaid_leave_days": "1.00",
        "other_deductions": "0.00",
    }

    # Trigger calculation as Admin/HR
    resp = client.post(
        f"/api/v1/payroll/calculate/{employee.id}",
        json=calc_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    pdata = resp.json()

    assert pdata["base_salary"] == "44000.00"
    # Gross base: 44000 + 10000 = 54000
    assert Decimal(pdata["gross_earning"]) >= Decimal("54000.00")
    # Unpaid leave deduction for 1 day = 54000 / 22 = 2454.55
    assert Decimal(pdata["unpaid_leave_deduction"]) > Decimal("0")
    assert Decimal(pdata["net_payable"]) > Decimal("0")

    # Employee views own payroll
    resp = client.get("/api/v1/payroll/me", headers={"Authorization": f"Bearer {emp_token}"})
    assert resp.status_code == 200
    records = resp.json()
    assert len(records) >= 1
