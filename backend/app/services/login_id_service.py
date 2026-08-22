from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.employee import Employee


def _user_initials(first_name: str, last_name: str) -> str:
    first_part = first_name.strip()[:2].upper().ljust(2, "X")
    last_part = last_name.strip()[:2].upper().ljust(2, "X")
    return f"{first_part}{last_part}"


def next_join_serial(db: Session, *, company_id, join_year: int) -> int:
    count = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.company_id == company_id,
            func.extract("year", Employee.date_of_joining) == join_year,
        )
    )
    return int(count or 0) + 1


def generate_login_id(
    *,
    company_initials: str,
    first_name: str,
    last_name: str,
    date_of_joining: date,
    serial: int,
) -> str:
    initials = company_initials.strip().upper()
    user_part = _user_initials(first_name, last_name)
    year_part = date_of_joining.year
    return f"{initials}{user_part}{year_part}{serial:04d}"


def generate_login_id_for_employee(
    db: Session,
    *,
    company: Company,
    first_name: str,
    last_name: str,
    date_of_joining: date,
) -> str:
    serial = next_join_serial(db, company_id=company.id, join_year=date_of_joining.year)
    return generate_login_id(
        company_initials=company.initials,
        first_name=first_name,
        last_name=last_name,
        date_of_joining=date_of_joining,
        serial=serial,
    )
