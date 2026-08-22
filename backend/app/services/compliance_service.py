from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ComplianceStatus
from app.models.company import Company
from app.models.compliance import ComplianceConfig
from app.schemas.compliance import ComplianceConfigUpdate


class ComplianceService:
    def get_or_create_compliance_config(self, db: Session, company_id: UUID) -> ComplianceConfig:
        company = db.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        config = db.scalar(select(ComplianceConfig).where(ComplianceConfig.company_id == company_id))
        if not config:
            config = ComplianceConfig(
                company_id=company_id,
                daily_limit_hours=Decimal("10.00"),
                weekly_limit_hours=Decimal("48.00"),
                quarterly_limit_hours=Decimal("144.00"),
                ot_multiplier=Decimal("2.00"),
                standard_work_hours_per_day=Decimal("8.00"),
            )
            db.add(config)
            db.commit()
            db.refresh(config)
        return config

    def update_compliance_config(
        self, db: Session, company_id: UUID, payload: ComplianceConfigUpdate
    ) -> ComplianceConfig:
        config = self.get_or_create_compliance_config(db, company_id)
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(config, key, value)
        db.commit()
        db.refresh(config)
        return config

    def evaluate_compliance_status(
        self,
        daily_hours: Decimal,
        weekly_ot: Decimal,
        quarterly_ot: Decimal,
        config: ComplianceConfig,
    ) -> tuple[ComplianceStatus, str]:
        if (
            daily_hours >= config.daily_limit_hours
            or weekly_ot >= config.weekly_limit_hours
            or quarterly_ot >= config.quarterly_limit_hours
        ):
            msg = (
                f"Exceeded limit: Daily {daily_hours}h/{config.daily_limit_hours}h, "
                f"Weekly OT {weekly_ot}h/{config.weekly_limit_hours}h, "
                f"Quarterly OT {quarterly_ot}h/{config.quarterly_limit_hours}h"
            )
            return ComplianceStatus.EXCEEDED_LIMIT, msg

        # Approaching limit threshold set at 80% of limit
        approaching_daily = daily_hours >= (config.daily_limit_hours * Decimal("0.80"))
        approaching_weekly = weekly_ot >= (config.weekly_limit_hours * Decimal("0.80"))
        approaching_quarterly = quarterly_ot >= (config.quarterly_limit_hours * Decimal("0.80"))

        if approaching_daily or approaching_weekly or approaching_quarterly:
            msg = (
                f"Approaching limit: Daily {daily_hours}h/{config.daily_limit_hours}h, "
                f"Weekly OT {weekly_ot}h/{config.weekly_limit_hours}h, "
                f"Quarterly OT {quarterly_ot}h/{config.quarterly_limit_hours}h"
            )
            return ComplianceStatus.APPROACHING_LIMIT, msg

        return ComplianceStatus.NORMAL, "Within normal limits"
