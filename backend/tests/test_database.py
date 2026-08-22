import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import AttendanceStatus, Role
from app.models import Attendance, Company, EmailVerificationToken, Employee, Holiday, User


def _create_company(db_session: Session) -> Company:
    company = Company(name="Test Company", initials="TC")
    db_session.add(company)
    db_session.flush()
    return company


def test_model_metadata_loads() -> None:
    table_names = set(User.metadata.tables.keys())
    assert table_names.issuperset({
        "users",
        "companies",
        "employees",
        "attendances",
        "holidays",
        "email_verification_tokens",
        "salary_structures",
        "compliance_configs",
        "payroll_records",
    })



def test_database_session_creation(db_session: Session) -> None:
    assert db_session is not None
    assert db_session.bind is not None


def test_user_insert_and_query(db_session: Session) -> None:
    user = User(
        employee_id="EMP-1001",
        email="employee@example.com",
        password_hash="hashed-password",
        role=Role.EMPLOYEE,
        is_verified=False,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    result = db_session.scalar(select(User).where(User.email == "employee@example.com"))
    assert result is not None
    assert result.employee_id == "EMP-1001"
    assert isinstance(result.id, uuid.UUID)


def test_employee_user_relationship(db_session: Session) -> None:
    company = _create_company(db_session)
    user = User(
        employee_id="EMP-2001",
        email="profile@example.com",
        password_hash="hashed-password",
        role=Role.EMPLOYEE,
    )
    employee = Employee(
        user=user,
        company_id=company.id,
        employee_id=user.employee_id,
        first_name="Jane",
        last_name="Doe",
        department="Engineering",
        date_of_joining=date(2026, 1, 1),
    )
    db_session.add(employee)
    db_session.flush()

    loaded = db_session.scalar(select(Employee).where(Employee.user_id == user.id))
    assert loaded is not None
    assert loaded.user.email == "profile@example.com"


def test_attendance_unique_per_employee_per_date(db_session: Session) -> None:
    company = _create_company(db_session)
    user = User(
        employee_id="EMP-3001",
        email="attendance@example.com",
        password_hash="hashed-password",
        role=Role.EMPLOYEE,
    )
    employee = Employee(
        user=user,
        company_id=company.id,
        employee_id=user.employee_id,
        first_name="Alex",
        last_name="Smith",
        date_of_joining=date(2026, 1, 1),
    )
    db_session.add(employee)
    db_session.flush()

    attendance_day = date(2026, 1, 15)
    first = Attendance(
        employee_id=employee.id,
        date=attendance_day,
        check_in=datetime.now(timezone.utc),
        status=AttendanceStatus.CHECKED_IN,
    )
    duplicate = Attendance(
        employee_id=employee.id,
        date=attendance_day,
        status=AttendanceStatus.ABSENT,
    )
    db_session.add(first)
    db_session.flush()
    db_session.add(duplicate)

    with pytest.raises(IntegrityError):
        db_session.flush()


def test_user_email_unique_constraint(db_session: Session) -> None:
    first = User(
        employee_id="EMP-4001",
        email="duplicate@example.com",
        password_hash="hashed-password",
        role=Role.EMPLOYEE,
    )
    second = User(
        employee_id="EMP-4002",
        email="duplicate@example.com",
        password_hash="hashed-password",
        role=Role.HR,
    )
    db_session.add(first)
    db_session.flush()
    db_session.add(second)

    with pytest.raises(IntegrityError):
        db_session.flush()


def test_email_verification_token_relationship(db_session: Session) -> None:
    user = User(
        employee_id="EMP-5001",
        email="verify@example.com",
        password_hash="hashed-password",
        role=Role.EMPLOYEE,
    )
    token = EmailVerificationToken(
        user=user,
        token_hash="sha256-example-hash",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db_session.add(token)
    db_session.flush()

    loaded = db_session.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
    )
    assert loaded is not None
    assert loaded.user.email == "verify@example.com"


def test_holiday_insert(db_session: Session) -> None:
    holiday = Holiday(
        name="New Year",
        date=date(2026, 1, 1),
        description="Public holiday",
    )
    db_session.add(holiday)
    db_session.flush()

    loaded = db_session.scalar(select(Holiday).where(Holiday.name == "New Year"))
    assert loaded is not None
    assert loaded.date == date(2026, 1, 1)
