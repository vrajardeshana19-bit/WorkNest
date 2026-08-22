import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.security import hash_password
from app.models.company import Company
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.user import User


def _create_employee_user(db_session: Session, first_name="John", role=Role.EMPLOYEE) -> tuple[User, Employee, Company]:
    suffix = uuid.uuid4().hex[:6]
    company = Company(name=f"Leave Co {suffix}", initials="LC")
    db_session.add(company)
    db_session.flush()

    login_id = f"LCJO2025{suffix[:4]}"
    user = User(
        employee_id=login_id,
        email=f"employee-{suffix}@example.com",
        password_hash=hash_password("temppass123"),
        role=role,
        is_verified=True,
        is_active=True,
        must_change_password=False,
    )
    employee = Employee(
        user=user,
        company_id=company.id,
        employee_id=login_id,
        first_name=first_name,
        last_name="Doe",
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


def test_create_leave_request(client: TestClient, db_session: Session) -> None:
    user, employee, company = _create_employee_user(db_session)
    token = _login(client, user.email, "temppass123")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "leave_type": "PAID_TIME_OFF",
        "reason": "VACATION",
        "start_date": "2026-08-25",
        "end_date": "2026-08-27",
        "remarks": "Family trip"
    }

    response = client.post("/api/v1/leaves", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["status"] == "PENDING"
    assert response.json()["employee_id"] == str(employee.id)

    # Overlapping leave should fail
    response_overlap = client.post("/api/v1/leaves", json=payload, headers=headers)
    assert response_overlap.status_code == 400
    assert "overlapping leave" in response_overlap.json()["detail"].lower()


def test_smart_leave_recommendation(client: TestClient, db_session: Session) -> None:
    # 1 HR and 3 Employees in Engineering
    hr_user, hr_employee, company = _create_employee_user(db_session, "HR", Role.HR)
    hr_token = _login(client, hr_user.email, "temppass123")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    emp1_user, emp1, _ = _create_employee_user(db_session, "Emp1")
    emp2_user, emp2, _ = _create_employee_user(db_session, "Emp2")
    emp3_user, emp3, _ = _create_employee_user(db_session, "Emp3")

    emp1.company_id = company.id
    emp2.company_id = company.id
    emp3.company_id = company.id
    db_session.flush()

    emp1_token = _login(client, emp1_user.email, "temppass123")
    
    # Emp2 takes leave
    db_session.add(LeaveRequest(
        employee_id=emp2.id,
        leave_type="PAID_TIME_OFF",
        reason="PERSONAL",
        start_date=date(2026, 8, 25),
        end_date=date(2026, 8, 26),
        status=LeaveStatus.APPROVED
    ))
    db_session.flush()

    # Emp1 requests leave 25-27 Aug
    payload = {
        "leave_type": "PAID_TIME_OFF",
        "reason": "VACATION",
        "start_date": "2026-08-25",
        "end_date": "2026-08-27"
    }
    create_res = client.post("/api/v1/leaves", json=payload, headers={"Authorization": f"Bearer {emp1_token}"})
    leave_id = create_res.json()["id"]

    # HR requests recommendation
    rec_res = client.get(f"/api/v1/leaves/{leave_id}/recommendation", headers=hr_headers)
    assert rec_res.status_code == 200
    data = rec_res.json()
    assert data["team_size"] == 4  # HR is in Engineering too in our test setup
    assert data["overlapping_leave_count"] == 1
    # available = 4 - 1 (emp2) - 1 (emp1) = 2. 2/4 = 50%
    assert data["coverage_during"] == 50
    assert data["recommendation"] == "REJECT"

    # Now HR approves leave
    approve_res = client.patch(f"/api/v1/leaves/{leave_id}/approve", headers=hr_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"
    
    # Check balance deducted
    balance_res = client.get("/api/v1/time-off/balances/me", headers={"Authorization": f"Bearer {emp1_token}"})
    assert balance_res.status_code == 200
    # Original 24 - 3 effective days (assuming no holiday/weekend) = 21
    assert balance_res.json()["paid_time_off_balance"] == 21
