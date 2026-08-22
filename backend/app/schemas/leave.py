import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.leave import LeaveReason, LeaveStatus, LeaveType


class LeaveRequestBase(BaseModel):
    leave_type: LeaveType
    reason: LeaveReason
    start_date: date
    end_date: date
    remarks: Optional[str] = None
    attachment_url: Optional[str] = None


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestResponse(LeaveRequestBase):
    id: uuid.UUID
    employee_id: uuid.UUID
    status: LeaveStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimeOffBalanceResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    year: int
    paid_time_off_balance: int
    sick_leave_balance: int

    model_config = ConfigDict(from_attributes=True)


class SmartLeaveRecommendationResponse(BaseModel):
    team_size: int
    overlapping_leave_count: int
    coverage_before: int
    coverage_during: int
    holiday_overlap: int
    effective_leave_days: int
    recommendation: str
    reason: str
