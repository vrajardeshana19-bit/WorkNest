import uuid
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import WageType


class SalaryStructureBase(BaseModel):
    wage_type: WageType = WageType.MONTHLY
    base_salary: Decimal = Field(default=Decimal("0.00"), ge=0)
    hra: Decimal = Field(default=Decimal("0.00"), ge=0)
    standard_allowance: Decimal = Field(default=Decimal("0.00"), ge=0)
    performance_bonus: Decimal = Field(default=Decimal("0.00"), ge=0)
    lta: Decimal = Field(default=Decimal("0.00"), ge=0)
    fixed_allowance: Decimal = Field(default=Decimal("0.00"), ge=0)
    pf_employee: Decimal = Field(default=Decimal("0.00"), ge=0)
    pf_employer: Decimal = Field(default=Decimal("0.00"), ge=0)
    professional_tax: Decimal = Field(default=Decimal("0.00"), ge=0)


class SalaryStructureCreate(SalaryStructureBase):
    pass


class SalaryStructureUpdate(BaseModel):
    wage_type: WageType | None = None
    base_salary: Decimal | None = Field(default=None, ge=0)
    hra: Decimal | None = Field(default=None, ge=0)
    standard_allowance: Decimal | None = Field(default=None, ge=0)
    performance_bonus: Decimal | None = Field(default=None, ge=0)
    lta: Decimal | None = Field(default=None, ge=0)
    fixed_allowance: Decimal | None = Field(default=None, ge=0)
    pf_employee: Decimal | None = Field(default=None, ge=0)
    pf_employer: Decimal | None = Field(default=None, ge=0)
    professional_tax: Decimal | None = Field(default=None, ge=0)


class SalaryStructureResponse(SalaryStructureBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    total_gross: Decimal
