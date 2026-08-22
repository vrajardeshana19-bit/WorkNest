import uuid
from decimal import Decimal
from pydantic import BaseModel

from app.core.enums import ComplianceStatus


class OvertimeDailyRecord(BaseModel):
    date: str
    work_hours: Decimal
    extra_hours: Decimal
    status: str


class EmployeeOvertimeDetail(BaseModel):
    employee_id: uuid.UUID
    login_id: str
    employee_name: str
    department: str | None = None
    daily_extra_hours_today: Decimal
    weekly_extra_hours: Decimal
    monthly_extra_hours: Decimal
    quarterly_extra_hours: Decimal
    compliance_status: ComplianceStatus
    records: list[OvertimeDailyRecord] = []


class OvertimeSummaryResponse(BaseModel):
    total_employees_with_ot: int
    total_extra_hours_this_month: Decimal
    overtime_records: list[EmployeeOvertimeDetail]
