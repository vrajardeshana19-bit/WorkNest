from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.leave import TimeOffBalanceResponse
from app.services.employee_service import employee_service
from app.services.leave_service import leave_service

router = APIRouter(prefix="/time-off", tags=["time-off"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/balances/me", response_model=TimeOffBalanceResponse)
def get_my_time_off_balance(
    current_user: CurrentUser,
    db: DbSession,
    year: int = Query(default_factory=lambda: datetime.utcnow().year),
):
    employee = employee_service.get_employee_by_user(db, current_user.id)
    return leave_service.get_leave_balances(db, employee.id, year)


@router.get("/calendar")
def get_calendar(_db: DbSession):
    # This would aggregate leaves, holidays, etc.
    # Leaving as a stub since frontend data structure can vary.
    return {"message": "Calendar data stub"}


@router.get("/calendar/me")
def get_my_calendar(_db: DbSession):
    return {"message": "My calendar data stub"}
