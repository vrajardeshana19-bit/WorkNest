from datetime import date as DateType
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HolidayCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    date: DateType
    description: str | None = None


class HolidayUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    date: DateType | None = None
    description: str | None = None


class HolidayResponse(BaseModel):
    id: UUID
    name: str
    date: DateType
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
