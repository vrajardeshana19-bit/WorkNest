from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ComplianceStatus
from app.database import get_db
from app.dependencies.auth import AdminUser, HrOrAdminUser
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.compliance import (
    ComplianceAlertItem,
    ComplianceAlertsResponse,
    ComplianceConfigResponse,
    ComplianceConfigUpdate,
)
from app.services.compliance_service import ComplianceService
from app.services.overtime_service import OvertimeService

router = APIRouter(prefix="/compliance", tags=["compliance"])
compliance_service = ComplianceService()
overtime_service = OvertimeService(compliance_service=compliance_service)


def _get_company_id(db: Session, current_user) -> str:
    if current_user.employee_profile and current_user.employee_profile.company_id:
        return current_user.employee_profile.company_id
    company = db.scalar(select(Company))
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No company found in database")
    return company.id


@router.get("/config", response_model=ComplianceConfigResponse)
def get_compliance_config(
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> ComplianceConfigResponse:
    company_id = _get_company_id(db, current_user)
    config = compliance_service.get_or_create_compliance_config(db, company_id)
    return config


@router.put("/config", response_model=ComplianceConfigResponse)
def update_compliance_config(
    payload: ComplianceConfigUpdate,
    current_user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> ComplianceConfigResponse:
    company_id = _get_company_id(db, current_user)
    config = compliance_service.update_compliance_config(db, company_id, payload)
    return config


@router.get("/alerts", response_model=ComplianceAlertsResponse)
def get_compliance_alerts(
    current_user: HrOrAdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> ComplianceAlertsResponse:
    company_id = _get_company_id(db, current_user)
    comp_config = compliance_service.get_or_create_compliance_config(db, company_id)

    employees = db.scalars(select(Employee).where(Employee.company_id == company_id)).all()

    alerts: list[ComplianceAlertItem] = []
    approaching = 0
    exceeded = 0

    for emp in employees:
        ot_detail = overtime_service.get_employee_overtime(db, emp)
        if ot_detail.compliance_status in (ComplianceStatus.APPROACHING_LIMIT, ComplianceStatus.EXCEEDED_LIMIT):
            _, warning_msg = compliance_service.evaluate_compliance_status(
                daily_hours=ot_detail.daily_extra_hours_today,
                weekly_ot=ot_detail.weekly_extra_hours,
                quarterly_ot=ot_detail.quarterly_extra_hours,
                config=comp_config,
            )

            if ot_detail.compliance_status == ComplianceStatus.APPROACHING_LIMIT:
                approaching += 1
            elif ot_detail.compliance_status == ComplianceStatus.EXCEEDED_LIMIT:
                exceeded += 1

            alerts.append(
                ComplianceAlertItem(
                    employee_id=emp.id,
                    login_id=emp.employee_id,
                    employee_name=f"{emp.first_name} {emp.last_name}",
                    department=emp.department,
                    daily_hours_today=ot_detail.daily_extra_hours_today,
                    weekly_overtime_hours=ot_detail.weekly_extra_hours,
                    quarterly_overtime_hours=ot_detail.quarterly_extra_hours,
                    status=ot_detail.compliance_status,
                    warning_message=warning_msg,
                )
            )

    return ComplianceAlertsResponse(
        total_alerts=len(alerts),
        approaching_count=approaching,
        exceeded_count=exceeded,
        alerts=alerts,
    )
