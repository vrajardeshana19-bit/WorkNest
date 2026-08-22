from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.enums import AttendanceStatus
from app.database import get_db
from app.dependencies.auth import CurrentUser, EmployeeUser, HrOrAdminUser
from app.models.attendance import Attendance
from app.schemas.attendance import (
    AdminDailyAttendanceResponse,
    AdminDailyAttendanceRow,
    AttendanceRecordResponse,
    MyAttendanceMonthResponse,
    AttendanceMonthSummary,
    TodayAttendanceStatusResponse,
)
from app.services.attendance_service import attendance_service

router = APIRouter(prefix="/attendance", tags=["attendance"])


def _format_time(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).strftime("%H:%M")


def _to_record_response(record: Attendance) -> AttendanceRecordResponse:
    return AttendanceRecordResponse(
        id=record.id,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        check_in_time=_format_time(record.check_in),
        check_out_time=_format_time(record.check_out),
        work_hours=record.total_hours,
        extra_hours=record.extra_hours,
        status=record.status,
    )


@router.post("/check-in", response_model=AttendanceRecordResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    db: Annotated[Session, Depends(get_db)],
    current_user: EmployeeUser,
) -> AttendanceRecordResponse:
    record = attendance_service.check_in(db, current_user)
    db.commit()
    db.refresh(record)
    return _to_record_response(record)


@router.post("/check-out", response_model=AttendanceRecordResponse)
def check_out(
    db: Annotated[Session, Depends(get_db)],
    current_user: EmployeeUser,
) -> AttendanceRecordResponse:
    record = attendance_service.check_out(db, current_user)
    db.commit()
    db.refresh(record)
    return _to_record_response(record)


@router.get("/me/today", response_model=TodayAttendanceStatusResponse)
def get_my_today_status(
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
) -> TodayAttendanceStatusResponse:
    payload = attendance_service.get_today_status(db, current_user)
    return TodayAttendanceStatusResponse(
        date=payload["date"],
        is_checked_in=payload["is_checked_in"],
        check_in_at=payload["check_in_at"],
        check_out_at=payload["check_out_at"],
        since=payload["since"],
        status=AttendanceStatus(payload["status"]),
    )


@router.get("/me", response_model=MyAttendanceMonthResponse)
def get_my_monthly_attendance(
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    year: Annotated[int | None, Query()] = None,
    month: Annotated[int | None, Query(ge=1, le=12)] = None,
) -> MyAttendanceMonthResponse:
    today = datetime.now(timezone.utc).date()
    target_year = year or today.year
    target_month = month or today.month

    payload = attendance_service.get_my_monthly_attendance(
        db,
        current_user,
        year=target_year,
        month=target_month,
    )
    return MyAttendanceMonthResponse(
        year=payload["year"],
        month=payload["month"],
        summary=AttendanceMonthSummary(**payload["summary"]),
        records=[_to_record_response(record) for record in payload["records"]],
    )


@router.get("", response_model=AdminDailyAttendanceResponse)
def get_daily_attendance(
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
    target_date: Annotated[date | None, Query(alias="date")] = None,
) -> AdminDailyAttendanceResponse:
    day = target_date or datetime.now(timezone.utc).date()
    rows = attendance_service.get_daily_attendance_for_admin(db, target_date=day)
    return AdminDailyAttendanceResponse(
        date=day,
        records=[
            AdminDailyAttendanceRow(
                employee_id=row["employee_id"],
                login_id=row["login_id"],
                employee_name=row["employee_name"],
                department=row["department"],
                date=row["date"],
                check_in=row["check_in"],
                check_out=row["check_out"],
                check_in_time=_format_time(row["check_in"]),
                check_out_time=_format_time(row["check_out"]),
                work_hours=row["work_hours"],
                extra_hours=row["extra_hours"],
                status=AttendanceStatus(row["status"]),
            )
            for row in rows
        ],
    )
