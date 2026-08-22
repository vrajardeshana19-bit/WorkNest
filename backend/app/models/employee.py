import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Employee(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "employees"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    employee_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    profile_picture: Mapped[str | None] = mapped_column(String(500), nullable=True)
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=False)

    # Resume tab
    about: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_love: Mapped[str | None] = mapped_column(Text, nullable=True)
    interests: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    certifications: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Private info tab
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    mailing_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    personal_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Bank details tab
    bank_account_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ifsc_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pan_no: Mapped[str | None] = mapped_column(String(32), nullable=True)
    uid_no: Mapped[str | None] = mapped_column(String(32), nullable=True)
    emp_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="employee_profile")
    company: Mapped["Company"] = relationship("Company", back_populates="employees")
    attendances: Mapped[list["Attendance"]] = relationship(
        "Attendance",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    salary_structure: Mapped["SalaryStructure | None"] = relationship(
        "SalaryStructure", back_populates="employee", uselist=False, cascade="all, delete-orphan"
    )
    payroll_records: Mapped[list["PayrollRecord"]] = relationship(
        "PayrollRecord", back_populates="employee", cascade="all, delete-orphan"
    )
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(
        "LeaveRequest", back_populates="employee", cascade="all, delete-orphan"
    )
    time_off_balances: Mapped[list["TimeOffBalance"]] = relationship(
        "TimeOffBalance", back_populates="employee", cascade="all, delete-orphan"
    )

