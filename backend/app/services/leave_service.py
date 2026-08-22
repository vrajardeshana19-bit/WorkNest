import uuid
from datetime import date, datetime
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import and_, extract, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType, TimeOffBalance
from app.schemas.leave import LeaveRequestCreate
from app.services.smart_leave_resolver import smart_leave_resolver


class LeaveService:
    def _get_or_create_balance(self, db: Session, employee_id: uuid.UUID, year: int) -> TimeOffBalance:
        balance = db.scalar(
            select(TimeOffBalance).where(
                and_(TimeOffBalance.employee_id == employee_id, TimeOffBalance.year == year)
            )
        )
        if not balance:
            balance = TimeOffBalance(employee_id=employee_id, year=year)
            db.add(balance)
            db.flush()
        return balance

    def create_leave_request(
        self, db: Session, employee_id: uuid.UUID, request_data: LeaveRequestCreate
    ) -> LeaveRequest:
        if request_data.start_date > request_data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before or equal to end date"
            )

        # Check for overlapping leaves for the same employee
        overlap = db.scalar(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.employee_id == employee_id,
                    LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
                    LeaveRequest.start_date <= request_data.end_date,
                    LeaveRequest.end_date >= request_data.start_date,
                )
            )
        )
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="You already have an overlapping leave request."
            )

        # Validate Balance early
        effective_days, _ = smart_leave_resolver.calculate_effective_days(
            db, request_data.start_date, request_data.end_date
        )
        if request_data.leave_type != LeaveType.UNPAID_LEAVE:
            balance = self._get_or_create_balance(db, employee_id, request_data.start_date.year)
            if request_data.leave_type == LeaveType.PAID_TIME_OFF and balance.paid_time_off_balance < effective_days:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient Paid Time Off balance.")
            elif request_data.leave_type == LeaveType.SICK_LEAVE and balance.sick_leave_balance < effective_days:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient Sick Leave balance.")

        leave_request = LeaveRequest(
            employee_id=employee_id,
            leave_type=request_data.leave_type,
            reason=request_data.reason,
            start_date=request_data.start_date,
            end_date=request_data.end_date,
            remarks=request_data.remarks,
            attachment_url=request_data.attachment_url,
            status=LeaveStatus.PENDING,
        )
        db.add(leave_request)
        db.flush()
        return leave_request

    def approve_leave(self, db: Session, leave_id: int) -> LeaveRequest:
        leave = db.get(LeaveRequest, leave_id)
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")
        if leave.status == LeaveStatus.APPROVED:
            return leave
        
        effective_days, _ = smart_leave_resolver.calculate_effective_days(db, leave.start_date, leave.end_date)
        
        if leave.leave_type != LeaveType.UNPAID_LEAVE:
            balance = self._get_or_create_balance(db, leave.employee_id, leave.start_date.year)
            if leave.leave_type == LeaveType.PAID_TIME_OFF:
                if balance.paid_time_off_balance < effective_days:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient Paid Time Off balance.")
                balance.paid_time_off_balance -= effective_days
            elif leave.leave_type == LeaveType.SICK_LEAVE:
                if balance.sick_leave_balance < effective_days:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient Sick Leave balance.")
                balance.sick_leave_balance -= effective_days

        leave.status = LeaveStatus.APPROVED
        db.flush()
        return leave

    def reject_leave(self, db: Session, leave_id: int) -> LeaveRequest:
        leave = db.get(LeaveRequest, leave_id)
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")
        
        leave.status = LeaveStatus.REJECTED
        db.flush()
        return leave

    def cancel_leave(self, db: Session, leave_id: int) -> LeaveRequest:
        leave = db.get(LeaveRequest, leave_id)
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")
        
        if leave.status == LeaveStatus.APPROVED and leave.leave_type != LeaveType.UNPAID_LEAVE:
            effective_days, _ = smart_leave_resolver.calculate_effective_days(db, leave.start_date, leave.end_date)
            balance = self._get_or_create_balance(db, leave.employee_id, leave.start_date.year)
            if leave.leave_type == LeaveType.PAID_TIME_OFF:
                balance.paid_time_off_balance += effective_days
            elif leave.leave_type == LeaveType.SICK_LEAVE:
                balance.sick_leave_balance += effective_days
                
        leave.status = LeaveStatus.CANCELLED
        db.flush()
        return leave

    def get_leave_balances(self, db: Session, employee_id: uuid.UUID, year: int) -> TimeOffBalance:
        return self._get_or_create_balance(db, employee_id, year)


leave_service = LeaveService()
