from datetime import date

from sqlalchemy import Date, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Holiday(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "holidays"
    __table_args__ = (UniqueConstraint("date", name="uq_holiday_date"),)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
