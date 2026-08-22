import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.schemas.leave import LeaveRequestCreate, LeaveRequestResponse, SmartLeaveRecommendationResponse
from app.services.email_service import get_email_sender
from app.services.employee_service import employee_service
from app.services.leave_service import leave_service
from app.services.smart_leave_resolver import smart_leave_resolver

router = APIRouter(prefix="/leaves", tags=["leaves"])
logger = logging.getLogger(__name__)

DbSession = Annotated[Session, Depends(get_db)]


def _notify_leave_status(db: Session, leave: LeaveRequest, status_label: str) -> bool:
    employee = db.scalar(
        select(Employee).options(selectinload(Employee.user)).where(Employee.id == leave.employee_id)
    )
    if employee is None or employee.user is None:
        return False
    email_sender = get_email_sender()
    leave_dates = f"{leave.start_date} → {leave.end_date}"
    try:
        email_sender.send_leave_status_email(
            to_email=employee.user.email,
            employee_name=f"{employee.first_name} {employee.last_name}",
            status=status_label,
            leave_dates=leave_dates,
            leave_type=leave.leave_type.value.replace("_", " ").title(),
        )
        return True
    except Exception as exc:
        logger.error("Failed to send leave status email to %s: %s", employee.user.email, exc)
        return False


@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    request_data: LeaveRequestCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> LeaveRequest:
    employee = employee_service.get_employee_by_user(db, current_user.id)
    leave = leave_service.create_leave_request(db, employee.id, request_data)
    db.commit()
    db.refresh(leave)
    return leave


@router.get("/me", response_model=list[LeaveRequestResponse])
def get_my_leave_requests(current_user: CurrentUser, db: DbSession):
    employee = employee_service.get_employee_by_user(db, current_user.id)
    return list(db.scalars(select(LeaveRequest).where(LeaveRequest.employee_id == employee.id)).all())


@router.get("", response_model=list[LeaveRequestResponse])
def get_all_leave_requests(_hr_user: HrOrAdminUser, db: DbSession):
    return list(db.scalars(select(LeaveRequest)).all())


@router.get("/{leave_id}", response_model=LeaveRequestResponse)
def get_leave_request(leave_id: uuid.UUID, current_user: CurrentUser, db: DbSession):
    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
    
    employee = employee_service.get_employee_by_user(db, current_user.id)
    # If not HR/Admin, ensure it belongs to them
    from app.core.enums import Role
    if current_user.role == Role.EMPLOYEE and leave.employee_id != employee.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this request")
    
    return leave


@router.get("/{leave_id}/recommendation", response_model=SmartLeaveRecommendationResponse)
def get_leave_recommendation(leave_id: uuid.UUID, _hr_user: HrOrAdminUser, db: DbSession):
    return smart_leave_resolver.analyze(db, leave_id)


@router.patch("/{leave_id}/approve", response_model=LeaveRequestResponse)
def approve_leave(leave_id: uuid.UUID, _hr_user: HrOrAdminUser, db: DbSession):
    leave = leave_service.approve_leave(db, leave_id)
    db.commit()
    db.refresh(leave)
    _notify_leave_status(db, leave, "APPROVED")
    return leave


@router.patch("/{leave_id}/reject", response_model=LeaveRequestResponse)
def reject_leave(leave_id: uuid.UUID, _hr_user: HrOrAdminUser, db: DbSession):
    leave = leave_service.reject_leave(db, leave_id)
    db.commit()
    db.refresh(leave)
    _notify_leave_status(db, leave, "REJECTED")
    return leave


@router.patch("/{leave_id}/cancel", response_model=LeaveRequestResponse)
def cancel_leave(leave_id: uuid.UUID, _hr_user: HrOrAdminUser, db: DbSession):
    return leave_service.cancel_leave(db, leave_id)
