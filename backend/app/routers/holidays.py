from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.schemas.holiday import HolidayCreateRequest, HolidayResponse, HolidayUpdateRequest
from app.services.holiday_service import holiday_service

router = APIRouter(prefix="/holidays", tags=["holidays"])


@router.get("", response_model=list[HolidayResponse])
def list_holidays(
    db: Annotated[Session, Depends(get_db)],
    _current_user: CurrentUser,
    year: Annotated[int | None, Query()] = None,
) -> list[HolidayResponse]:
    holidays = holiday_service.list_holidays(db, year=year)
    return [HolidayResponse.model_validate(holiday) for holiday in holidays]


@router.post("", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(
    payload: HolidayCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
) -> HolidayResponse:
    holiday = holiday_service.create_holiday(
        db,
        name=payload.name,
        holiday_date=payload.date,
        description=payload.description,
    )
    db.commit()
    db.refresh(holiday)
    return HolidayResponse.model_validate(holiday)


@router.patch("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    holiday_id: UUID,
    payload: HolidayUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
) -> HolidayResponse:
    holiday = holiday_service.update_holiday(
        db,
        holiday_id,
        name=payload.name,
        holiday_date=payload.date,
        description=payload.description,
    )
    db.commit()
    db.refresh(holiday)
    return HolidayResponse.model_validate(holiday)


@router.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(
    holiday_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    _current_user: HrOrAdminUser,
) -> None:
    holiday_service.delete_holiday(db, holiday_id)
    db.commit()
