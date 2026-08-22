import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

from app.core.enums import PayrollStatus
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PayrollRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payroll_records"
    __table_args__ = (
        UniqueConstraint("employee_id", "year", "month", name="uq_payroll_employee_year_month"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)

    base_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    gross_earning: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    overtime_hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, default=0.00)
    overtime_pay: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    unpaid_leave_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0.00)
    unpaid_leave_deduction: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    pf_deduction: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    tax_deduction: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    other_deductions: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    net_payable: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    status: Mapped[PayrollStatus] = mapped_column(
        SQLEnum(PayrollStatus, name="payroll_status", native_enum=False, length=32),
        nullable=False,
        default=PayrollStatus.DRAFT,
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="payroll_records")
