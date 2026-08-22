import uuid
from datetime import date, timedelta
from typing import Literal

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.holiday import Holiday
from app.models.leave import LeaveReason, LeaveRequest, LeaveStatus
from app.schemas.leave import SmartLeaveRecommendationResponse


class SmartLeaveResolver:
    def calculate_effective_days(self, db: Session, start_date: date, end_date: date) -> tuple[int, int]:
        """Calculates total working days excluding weekends and company holidays."""
        current_date = start_date
        total_days = (end_date - start_date).days + 1
        weekend_days = 0
        holiday_days = 0

        # Query holidays in range
        holidays = db.scalars(
            select(Holiday.date).where(
                and_(Holiday.date >= start_date, Holiday.date <= end_date)
            )
        ).all()
        holiday_dates = set(holidays)

        effective_days = 0
        while current_date <= end_date:
            if current_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
                weekend_days += 1
            elif current_date in holiday_dates:
                holiday_days += 1
            else:
                effective_days += 1
            current_date += timedelta(days=1)

        return effective_days, holiday_days

    def analyze(self, db: Session, leave_id: uuid.UUID) -> SmartLeaveRecommendationResponse:
        leave = db.get(LeaveRequest, leave_id)
        if not leave:
            raise ValueError("Leave request not found")

        employee = db.get(Employee, leave.employee_id)
        if not employee:
            raise ValueError("Employee not found")

        # 1. Team Size (Department-based)
        if employee.department:
            team_size = db.scalar(
                select(func.count(Employee.id)).where(Employee.department == employee.department)
            )
        else:
            team_size = 1 # Fallback if no department

        # 2. Overlapping Leaves
        overlapping_leaves_query = select(func.count(LeaveRequest.id)).join(Employee).where(
            and_(
                LeaveRequest.id != leave.id,
                LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
                LeaveRequest.start_date <= leave.end_date,
                LeaveRequest.end_date >= leave.start_date,
                Employee.department == employee.department
            )
        )
        overlapping_leave_count = db.scalar(overlapping_leaves_query) or 0

        # 3. Holiday Overlap & Effective Days
        effective_leave_days, holiday_overlap = self.calculate_effective_days(
            db, leave.start_date, leave.end_date
        )

        # 4. Coverage Calculations
        coverage_before = 100  # Simplified assumption for before
        coverage_after = 100   # Simplified assumption for after
        
        available_during = team_size - overlapping_leave_count - 1 # -1 for the current requester
        coverage_during = int((available_during / team_size) * 100) if team_size > 0 else 0

        # 5. Recommendation Logic
        recommendation: Literal["APPROVE", "APPROVE_WITH_CAUTION", "REJECT"] = "APPROVE"
        reason = ""

        if coverage_during >= 80:
            recommendation = "APPROVE"
            reason = f"Team coverage remains high at {coverage_during}%."
        elif 60 <= coverage_during <= 79:
            recommendation = "APPROVE_WITH_CAUTION"
            reason = f"Team coverage falls to {coverage_during}% during the requested period."
        else:
            recommendation = "REJECT"
            reason = f"Team coverage falls critically low to {coverage_during}%."

        # 6. Medical / Emergency Override
        if recommendation == "REJECT" and leave.reason in [LeaveReason.MEDICAL, LeaveReason.EMERGENCY]:
            recommendation = "APPROVE_WITH_CAUTION"
            reason += f" However, due to {leave.reason.value}, recommendation is adjusted to APPROVE_WITH_CAUTION."

        return SmartLeaveRecommendationResponse(
            team_size=team_size,
            overlapping_leave_count=overlapping_leave_count,
            coverage_before=coverage_before,
            coverage_during=coverage_during,
            holiday_overlap=holiday_overlap,
            effective_leave_days=effective_leave_days,
            recommendation=recommendation,
            reason=reason
        )


smart_leave_resolver = SmartLeaveResolver()
