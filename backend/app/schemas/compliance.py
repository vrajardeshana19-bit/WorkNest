import uuid
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ComplianceStatus


class ComplianceConfigBase(BaseModel):
    daily_limit_hours: Decimal = Field(default=Decimal("10.00"), gt=0)
    weekly_limit_hours: Decimal = Field(default=Decimal("48.00"), gt=0)
    quarterly_limit_hours: Decimal = Field(default=Decimal("144.00"), gt=0)
    ot_multiplier: Decimal = Field(default=Decimal("2.00"), ge=1)
    standard_work_hours_per_day: Decimal = Field(default=Decimal("8.00"), gt=0)


class ComplianceConfigUpdate(BaseModel):
    daily_limit_hours: Decimal | None = Field(default=None, gt=0)
    weekly_limit_hours: Decimal | None = Field(default=None, gt=0)
    quarterly_limit_hours: Decimal | None = Field(default=None, gt=0)
    ot_multiplier: Decimal | None = Field(default=None, ge=1)
    standard_work_hours_per_day: Decimal | None = Field(default=None, gt=0)


class ComplianceConfigResponse(ComplianceConfigBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID


class ComplianceAlertItem(BaseModel):
    employee_id: uuid.UUID
    login_id: str
    employee_name: str
    department: str | None = None
    daily_hours_today: Decimal
    weekly_overtime_hours: Decimal
    quarterly_overtime_hours: Decimal
    status: ComplianceStatus
    warning_message: str


class ComplianceAlertsResponse(BaseModel):
    total_alerts: int
    approaching_count: int
    exceeded_count: int
    alerts: list[ComplianceAlertItem]
