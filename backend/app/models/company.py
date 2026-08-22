from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Company(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    initials: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    employees: Mapped[list["Employee"]] = relationship("Employee", back_populates="company")
    compliance_config: Mapped["ComplianceConfig | None"] = relationship(
        "ComplianceConfig", back_populates="company", uselist=False, cascade="all, delete-orphan"
    )

