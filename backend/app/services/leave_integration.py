from datetime import date

from sqlalchemy.orm import Session


def is_employee_on_leave_today(_db: Session, _employee_id, _today: date) -> bool:
    """Placeholder for Person 2 (Leave module). Returns False until integrated."""
    return False


def get_employee_leave_days_in_month(
    _db: Session,
    _employee_id,
    _year: int,
    _month: int,
) -> int:
    """Placeholder for Person 2 (Leave module). Returns 0 until integrated."""
    return 0
