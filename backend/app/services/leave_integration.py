from datetime import date

from sqlalchemy import and_, extract, select
from sqlalchemy.orm import Session

from app.models.leave import LeaveRequest, LeaveStatus


def is_employee_on_leave_today(db: Session, employee_id, today: date) -> bool:
    """Returns True if employee has an APPROVED leave encompassing 'today'."""
    leave = db.scalar(
        select(LeaveRequest.id).where(
            and_(
                LeaveRequest.employee_id == employee_id,
                LeaveRequest.status == LeaveStatus.APPROVED,
                LeaveRequest.start_date <= today,
                LeaveRequest.end_date >= today
            )
        )
    )
    return leave is not None


def get_employee_leave_days_in_month(
    db: Session,
    employee_id,
    year: int,
    month: int,
) -> int:
    """Placeholder calculation. For precise days (handling overlaps), a complex query is needed."""
    leaves = db.scalars(
        select(LeaveRequest).where(
            and_(
                LeaveRequest.employee_id == employee_id,
                LeaveRequest.status == LeaveStatus.APPROVED,
                extract('year', LeaveRequest.start_date) == year,
                extract('month', LeaveRequest.start_date) == month
            )
        )
    ).all()
    # Simplified calculation for now since this is just integration placeholder
    # Ideal calculation would use SmartLeaveResolver to calculate effective days in that month
    return sum((leave.end_date - leave.start_date).days + 1 for leave in leaves)
