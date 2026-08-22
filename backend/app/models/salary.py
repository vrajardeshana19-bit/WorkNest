import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

from app.core.enums import WageType
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SalaryStructure(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "salary_structures"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    wage_type: Mapped[WageType] = mapped_column(
        SQLEnum(WageType, name="wage_type", native_enum=False, length=32),
        nullable=False,
        default=WageType.MONTHLY,
    )
    base_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    hra: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    standard_allowance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    performance_bonus: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    lta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    fixed_allowance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    # Deductions & Taxes
    pf_employee: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    pf_employer: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    professional_tax: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="salary_structure")

    @property
    def total_gross(self) -> Decimal:
        return (
            (self.base_salary or Decimal("0.00"))
            + (self.hra or Decimal("0.00"))
            + (self.standard_allowance or Decimal("0.00"))
            + (self.performance_bonus or Decimal("0.00"))
            + (self.lta or Decimal("0.00"))
            + (self.fixed_allowance or Decimal("0.00"))
        )

