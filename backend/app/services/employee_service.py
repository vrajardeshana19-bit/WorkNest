import logging
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.enums import Role
from app.core.security import generate_temp_password, hash_password
from app.models.company import Company
from app.models.employee import Employee
from app.models.user import User
from app.services.email_service import EmailSender, get_email_sender
from app.services.login_id_service import generate_login_id_for_employee

logger = logging.getLogger(__name__)


class EmployeeService:
    def __init__(self, email_sender: EmailSender | None = None) -> None:
        self.email_sender = email_sender or get_email_sender()

    def create_company(
        self,
        db: Session,
        *,
        name: str,
        initials: str,
        logo_url: str | None = None,
    ) -> Company:
        normalized_initials = initials.strip().upper()
        if db.scalar(select(Company).where(Company.name == name.strip())):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company already exists")

        company = Company(name=name.strip(), initials=normalized_initials, logo_url=logo_url)
        db.add(company)
        db.flush()
        return company

    def create_employee(
        self,
        db: Session,
        *,
        company_id: UUID,
        first_name: str,
        last_name: str,
        email: str,
        phone: str | None,
        date_of_joining: date,
        department: str | None = None,
        designation: str | None = None,
        role: Role = Role.EMPLOYEE,
    ) -> tuple[User, Employee, str | None, bool]:
        company = db.get(Company, company_id)
        if company is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        normalized_email = email.strip().lower()
        if db.scalar(select(User).where(User.email == normalized_email)):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

        login_id = generate_login_id_for_employee(
            db,
            company=company,
            first_name=first_name,
            last_name=last_name,
            date_of_joining=date_of_joining,
        )
        if db.scalar(select(User).where(User.employee_id == login_id)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Generated Login ID already exists — retry creation",
            )

        temp_password = generate_temp_password()
        user = User(
            employee_id=login_id,
            email=normalized_email,
            password_hash=hash_password(temp_password),
            role=role,
            is_verified=True,
            is_active=True,
            must_change_password=True,
        )
        employee = Employee(
            user=user,
            company_id=company.id,
            employee_id=login_id,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            phone=phone,
            date_of_joining=date_of_joining,
            department=department,
            designation=designation,
        )
        db.add(user)
        db.add(employee)
        db.flush()

        credentials_email_sent = False
        try:
            self.email_sender.send_credentials_email(
                to_email=user.email,
                login_id=login_id,
                temporary_password=temp_password,
            )
            credentials_email_sent = True
        except Exception as exc:
            logger.error("Failed to send credentials email to %s: %s", user.email, exc)

        from app.config import get_settings

        debug_password = temp_password if get_settings().debug else None
        return user, employee, debug_password, credentials_email_sent

    def list_employees(self, db: Session) -> list[Employee]:
        return list(
            db.scalars(
                select(Employee)
                .options(selectinload(Employee.user), selectinload(Employee.company))
                .order_by(Employee.first_name, Employee.last_name)
            ).all()
        )

    def get_employee(self, db: Session, employee_id: UUID) -> Employee:
        employee = db.scalar(
            select(Employee)
            .options(selectinload(Employee.user), selectinload(Employee.company))
            .where(Employee.id == employee_id)
        )
        if employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        return employee

    def get_employee_by_user(self, db: Session, user_id: UUID) -> Employee:
        employee = db.scalar(
            select(Employee)
            .options(selectinload(Employee.user), selectinload(Employee.company))
            .where(Employee.user_id == user_id)
        )
        if employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
        return employee

    def update_own_profile(
        self,
        db: Session,
        employee: Employee,
        updates: dict,
    ) -> Employee:
        allowed_fields = {
            "phone",
            "address",
            "about",
            "job_love",
            "interests",
            "skills",
            "certifications",
            "date_of_birth",
            "mailing_address",
            "personal_email",
            "gender",
            "marital_status",
            "bank_account_number",
            "bank_name",
            "ifsc_code",
            "pan_no",
            "uid_no",
            "profile_picture",
        }
        for field, value in updates.items():
            if field in allowed_fields:
                setattr(employee, field, value)
        db.flush()
        return employee


employee_service = EmployeeService()
