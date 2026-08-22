from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.enums import AttendanceStatus
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.holiday import Holiday
from app.services.employee_service import employee_service
from app.services.leave_integration import get_employee_leave_days_in_month
from app.utils.calendar import count_weekdays_in_month_excluding_dates


def _quantize_hours(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _calculate_hours(check_in: datetime, check_out: datetime) -> tuple[Decimal, Decimal]:
    settings = get_settings()
    if check_in.tzinfo is None and check_out.tzinfo is not None:
        check_in = check_in.replace(tzinfo=timezone.utc)
    elif check_out.tzinfo is None and check_in.tzinfo is not None:
        check_out = check_out.replace(tzinfo=timezone.utc)
    duration = check_out - check_in
    total_hours = _quantize_hours(Decimal(duration.total_seconds()) / Decimal(3600))
    standard = Decimal(str(settings.standard_work_hours_per_day))
    extra_hours = _quantize_hours(max(Decimal("0"), total_hours - standard))
    return total_hours, extra_hours



def _format_time(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).strftime("%H:%M")


class AttendanceService:
    def _today(self) -> date:
        return datetime.now(timezone.utc).date()

    def _get_employee_for_user(self, db: Session, user) -> Employee:
        return employee_service.get_employee_by_user(db, user.id)

    def check_in(self, db: Session, user) -> Attendance:
        employee = self._get_employee_for_user(db, user)
        today = self._today()
        now = datetime.now(timezone.utc)

        record = db.scalar(
            select(Attendance).where(
                Attendance.employee_id == employee.id,
                Attendance.date == today,
            )
        )
        if record is not None and record.check_in is not None and record.check_out is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already checked in for today",
            )
        if record is not None and record.check_out is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Attendance already completed for today",
            )

        if record is None:
            record = Attendance(
                employee_id=employee.id,
                date=today,
                check_in=now,
                status=AttendanceStatus.CHECKED_IN,
            )
            db.add(record)
        else:
            record.check_in = now
            record.status = AttendanceStatus.CHECKED_IN

        db.flush()
        return record

    def check_out(self, db: Session, user) -> Attendance:
        employee = self._get_employee_for_user(db, user)
        today = self._today()
        now = datetime.now(timezone.utc)

        record = db.scalar(
            select(Attendance).where(
                Attendance.employee_id == employee.id,
                Attendance.date == today,
            )
        )
        if record is None or record.check_in is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must check in before checking out",
            )
        if record.check_out is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already checked out for today",
            )

        total_hours, extra_hours = _calculate_hours(record.check_in, now)
        record.check_out = now
        record.total_hours = total_hours
        record.extra_hours = extra_hours
        record.status = AttendanceStatus.COMPLETE
        db.flush()
        return record

    def get_today_status(self, db: Session, user) -> dict:
        employee = self._get_employee_for_user(db, user)
        today = self._today()
        record = db.scalar(
            select(Attendance).where(
                Attendance.employee_id == employee.id,
                Attendance.date == today,
            )
        )
        is_checked_in = record is not None and record.check_in is not None and record.check_out is None
        return {
            "date": today,
            "is_checked_in": is_checked_in,
            "check_in_at": record.check_in if record else None,
            "check_out_at": record.check_out if record else None,
            "since": _format_time(record.check_in) if is_checked_in and record else None,
            "status": record.status.value if record else AttendanceStatus.ABSENT.value,
        }

    def get_my_monthly_attendance(self, db: Session, user, *, year: int, month: int) -> dict:
        employee = self._get_employee_for_user(db, user)
        records = list(
            db.scalars(
                select(Attendance)
                .where(
                    Attendance.employee_id == employee.id,
                    extract("year", Attendance.date) == year,
                    extract("month", Attendance.date) == month,
                )
                .order_by(Attendance.date.desc())
            ).all()
        )

        holiday_dates = set(
            db.scalars(
                select(Holiday.date).where(
                    extract("year", Holiday.date) == year,
                    extract("month", Holiday.date) == month,
                )
            ).all()
        )
        total_working_days = count_weekdays_in_month_excluding_dates(year, month, holiday_dates)
        days_present = sum(
            1
            for record in records
            if record.check_in is not None
            and record.status in (AttendanceStatus.CHECKED_IN, AttendanceStatus.COMPLETE)
        )
        leaves_count = get_employee_leave_days_in_month(db, employee.id, year, month)

        return {
            "year": year,
            "month": month,
            "summary": {
                "days_present": days_present,
                "leaves_count": leaves_count,
                "total_working_days": total_working_days,
            },
            "records": records,
        }

    def get_daily_attendance_for_admin(self, db: Session, *, target_date: date) -> list[dict]:
        employees = employee_service.list_employees(db)
        attendance_rows = {
            row.employee_id: row
            for row in db.scalars(
                select(Attendance).where(Attendance.date == target_date)
            ).all()
        }

        results: list[dict] = []
        for employee in employees:
            record = attendance_rows.get(employee.id)
            results.append(
                {
                    "employee_id": employee.id,
                    "login_id": employee.employee_id,
                    "employee_name": f"{employee.first_name} {employee.last_name}",
                    "department": employee.department,
                    "date": target_date,
                    "check_in": record.check_in if record else None,
                    "check_out": record.check_out if record else None,
                    "work_hours": record.total_hours if record else None,
                    "extra_hours": record.extra_hours if record else None,
                    "status": record.status.value if record else AttendanceStatus.ABSENT.value,
                }
            )
        return results


attendance_service = AttendanceService()
