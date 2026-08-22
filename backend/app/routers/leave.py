from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import CurrentUser, HrOrAdminUser
from app.models.leave import LeaveRequest
from app.schemas.leave import LeaveRequestCreate, LeaveRequestResponse, SmartLeaveRecommendationResponse
from app.services.employee_service import employee_service
from app.services.leave_service import leave_service
from app.services.smart_leave_resolver import smart_leave_resolver

router = APIRouter(prefix="/leaves", tags=["leaves"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    request_data: LeaveRequestCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> LeaveRequest:
    employee = employee_service.get_employee_by_user(db, current_user.id)
    return leave_service.create_leave_request(db, employee.id, request_data)


@router.get("/me", response_model=list[LeaveRequestResponse])
def get_my_leave_requests(current_user: CurrentUser, db: DbSession):
    employee = employee_service.get_employee_by_user(db, current_user.id)
    return list(db.scalars(select(LeaveRequest).where(LeaveRequest.employee_id == employee.id)).all())


@router.get("", response_model=list[LeaveRequestResponse])
def get_all_leave_requests(_hr_user: HrOrAdminUser, db: DbSession):
    return list(db.scalars(select(LeaveRequest)).all())


@router.get("/{leave_id}", response_model=LeaveRequestResponse)
def get_leave_request(leave_id: int, current_user: CurrentUser, db: DbSession):
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
def get_leave_recommendation(leave_id: int, _hr_user: HrOrAdminUser, db: DbSession):
    return smart_leave_resolver.analyze(db, leave_id)


@router.patch("/{leave_id}/approve", response_model=LeaveRequestResponse)
def approve_leave(leave_id: int, _hr_user: HrOrAdminUser, db: DbSession):
    return leave_service.approve_leave(db, leave_id)


@router.patch("/{leave_id}/reject", response_model=LeaveRequestResponse)
def reject_leave(leave_id: int, _hr_user: HrOrAdminUser, db: DbSession):
    return leave_service.reject_leave(db, leave_id)


@router.patch("/{leave_id}/cancel", response_model=LeaveRequestResponse)
def cancel_leave(leave_id: int, _hr_user: HrOrAdminUser, db: DbSession):
    return leave_service.cancel_leave(db, leave_id)
