import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class LeaveType(str, enum.Enum):
    PAID_TIME_OFF = "PAID_TIME_OFF"
    SICK_LEAVE = "SICK_LEAVE"
    UNPAID_LEAVE = "UNPAID_LEAVE"


class LeaveReason(str, enum.Enum):
    PERSONAL = "PERSONAL"
    VACATION = "VACATION"
    MEDICAL = "MEDICAL"
    EMERGENCY = "EMERGENCY"


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeaveRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "leave_requests"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    leave_type: Mapped[LeaveType] = mapped_column(Enum(LeaveType), nullable=False)
    reason: Mapped[LeaveReason] = mapped_column(Enum(LeaveReason), nullable=False)
    
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_requests")  # noqa: F821


class TimeOffBalance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "time_off_balances"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    paid_time_off_balance: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    sick_leave_balance: Mapped[int] = mapped_column(Integer, default=7, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="time_off_balances")  # noqa: F821

    __table_args__ = (
        UniqueConstraint("employee_id", "year", name="uq_employee_year_balance"),
    )
