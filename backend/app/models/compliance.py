import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ComplianceConfig(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "compliance_configs"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    daily_limit_hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=10.00)
    weekly_limit_hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=48.00)
    quarterly_limit_hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, default=144.00)
    ot_multiplier: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False, default=2.00)
    standard_work_hours_per_day: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=8.00)

    company: Mapped["Company"] = relationship("Company", back_populates="compliance_config")
