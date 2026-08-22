from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AttendanceStatus, EmployeeDisplayStatus
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.services.leave_integration import is_employee_on_leave_today


def get_employee_display_status(db: Session, employee: Employee, *, on_date: date | None = None) -> EmployeeDisplayStatus:
    target_date = on_date or datetime.now(timezone.utc).date()

    if is_employee_on_leave_today(db, employee.id, target_date):
        return EmployeeDisplayStatus.ON_LEAVE

    attendance = db.scalar(
        select(Attendance).where(
            Attendance.employee_id == employee.id,
            Attendance.date == target_date,
            Attendance.check_in.is_not(None),
            Attendance.status.in_([AttendanceStatus.CHECKED_IN, AttendanceStatus.COMPLETE]),
        )
    )
    if attendance is not None:
        return EmployeeDisplayStatus.PRESENT

    return EmployeeDisplayStatus.ABSENT


def get_current_user_display_status(db: Session, user) -> EmployeeDisplayStatus | None:
    if user.employee_profile is None:
        return None
    return get_employee_display_status(db, user.employee_profile)
