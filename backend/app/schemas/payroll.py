import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.core.enums import PayrollStatus


class PayrollCalculationRequest(BaseModel):
    year: int
    month: int
    unpaid_leave_days: Decimal = Decimal("0.00")
    other_deductions: Decimal = Decimal("0.00")


class PayrollProcessAllRequest(BaseModel):
    year: int
    month: int


class PayrollResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    login_id: str | None = None
    employee_name: str | None = None
    department: str | None = None
    year: int
    month: int
    base_salary: Decimal
    gross_earning: Decimal
    overtime_hours: Decimal
    overtime_pay: Decimal
    unpaid_leave_days: Decimal
    unpaid_leave_deduction: Decimal
    pf_deduction: Decimal
    tax_deduction: Decimal
    other_deductions: Decimal
    net_payable: Decimal
    status: PayrollStatus
    processed_at: datetime | None = None


class PayrollSummaryResponse(BaseModel):
    year: int
    month: int
    total_employees_processed: int
    total_gross_payout: Decimal
    total_net_payout: Decimal
    records: list[PayrollResponse]
