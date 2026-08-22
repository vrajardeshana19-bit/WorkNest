from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.enums import AttendanceStatus


class AttendanceRecordResponse(BaseModel):
    id: UUID
    date: date
    check_in: datetime | None
    check_out: datetime | None
    check_in_time: str | None = None
    check_out_time: str | None = None
    work_hours: Decimal | None = None
    extra_hours: Decimal | None = None
    status: AttendanceStatus

    model_config = {"from_attributes": True}


class AttendanceMonthSummary(BaseModel):
    days_present: int
    leaves_count: int
    total_working_days: int


class MyAttendanceMonthResponse(BaseModel):
    year: int
    month: int
    summary: AttendanceMonthSummary
    records: list[AttendanceRecordResponse]


class TodayAttendanceStatusResponse(BaseModel):
    date: date
    is_checked_in: bool
    check_in_at: datetime | None
    check_out_at: datetime | None
    since: str | None = Field(default=None, description="Check-in time HH:MM for systray")
    status: AttendanceStatus


class AdminDailyAttendanceRow(BaseModel):
    employee_id: UUID
    login_id: str
    employee_name: str
    department: str | None
    date: date
    check_in: datetime | None
    check_out: datetime | None
    check_in_time: str | None = None
    check_out_time: str | None = None
    work_hours: Decimal | None = None
    extra_hours: Decimal | None = None
    status: AttendanceStatus


class AdminDailyAttendanceResponse(BaseModel):
    date: date
    records: list[AdminDailyAttendanceRow]
