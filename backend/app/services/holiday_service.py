import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.models.holiday import Holiday


class HolidayService:
    def list_holidays(self, db: Session, *, year: int | None = None) -> list[Holiday]:
        query = select(Holiday).order_by(Holiday.date)
        if year is not None:
            query = query.where(extract("year", Holiday.date) == year)
        return list(db.scalars(query).all())

    def create_holiday(
        self,
        db: Session,
        *,
        name: str,
        holiday_date: date,
        description: str | None = None,
    ) -> Holiday:
        if db.scalar(select(Holiday).where(Holiday.date == holiday_date)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Holiday already exists for this date",
            )
        holiday = Holiday(name=name.strip(), date=holiday_date, description=description)
        db.add(holiday)
        db.flush()
        return holiday

    def update_holiday(
        self,
        db: Session,
        holiday_id: uuid.UUID,
        *,
        name: str | None = None,
        holiday_date: date | None = None,
        description: str | None = None,
    ) -> Holiday:
        holiday = db.get(Holiday, holiday_id)
        if holiday is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")

        if holiday_date is not None and holiday_date != holiday.date:
            conflict = db.scalar(
                select(Holiday).where(Holiday.date == holiday_date, Holiday.id != holiday_id)
            )
            if conflict is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Holiday already exists for this date",
                )
            holiday.date = holiday_date
        if name is not None:
            holiday.name = name.strip()
        if description is not None:
            holiday.description = description
        db.flush()
        return holiday

    def delete_holiday(self, db: Session, holiday_id: uuid.UUID) -> None:
        holiday = db.get(Holiday, holiday_id)
        if holiday is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")
        db.delete(holiday)
        db.flush()


holiday_service = HolidayService()
