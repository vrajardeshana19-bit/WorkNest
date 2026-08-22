"""add_payroll_salary_compliance

Revision ID: 6f9b8c7d6e5f
Revises: 531a5d356189
Create Date: 2026-08-22 11:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6f9b8c7d6e5f'
down_revision: Union[str, Sequence[str], None] = '531a5d356189'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # compliance_configs
    op.create_table(
        'compliance_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('daily_limit_hours', sa.Numeric(5, 2), nullable=False, server_default='10.00'),
        sa.Column('weekly_limit_hours', sa.Numeric(5, 2), nullable=False, server_default='48.00'),
        sa.Column('quarterly_limit_hours', sa.Numeric(6, 2), nullable=False, server_default='144.00'),
        sa.Column('ot_multiplier', sa.Numeric(4, 2), nullable=False, server_default='2.00'),
        sa.Column('standard_work_hours_per_day', sa.Numeric(5, 2), nullable=False, server_default='8.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # salary_structures
    op.create_table(
        'salary_structures',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('wage_type', sa.String(32), nullable=False, server_default='MONTHLY'),
        sa.Column('base_salary', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('hra', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('standard_allowance', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('performance_bonus', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('lta', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('fixed_allowance', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('pf_employee', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('pf_employer', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('professional_tax', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # payroll_records
    op.create_table(
        'payroll_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('base_salary', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('gross_earning', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('overtime_hours', sa.Numeric(6, 2), nullable=False, server_default='0.00'),
        sa.Column('overtime_pay', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('unpaid_leave_days', sa.Numeric(5, 2), nullable=False, server_default='0.00'),
        sa.Column('unpaid_leave_deduction', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('pf_deduction', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('tax_deduction', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('other_deductions', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('net_payable', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('status', sa.String(32), nullable=False, server_default='DRAFT'),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('employee_id', 'year', 'month', name='uq_payroll_employee_year_month'),
    )


def downgrade() -> None:
    op.drop_table('payroll_records')
    op.drop_table('salary_structures')
    op.drop_table('compliance_configs')
