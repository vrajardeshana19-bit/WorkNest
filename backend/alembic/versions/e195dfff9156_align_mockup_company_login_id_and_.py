"""align mockup company login id and employee profile

Revision ID: e195dfff9156
Revises: 4915ee8f1c97
Create Date: 2026-08-22 10:39:11.822994

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e195dfff9156"
down_revision: Union[str, Sequence[str], None] = "4915ee8f1c97"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("initials", sa.String(length=10), nullable=False),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_companies_initials"), "companies", ["initials"], unique=False)

    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("users", "must_change_password", server_default=None)

    op.add_column("employees", sa.Column("company_id", sa.UUID(), nullable=True))
    op.add_column("employees", sa.Column("date_of_joining", sa.Date(), nullable=True))
    op.add_column("employees", sa.Column("about", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("job_love", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("interests", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("skills", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("certifications", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("employees", sa.Column("mailing_address", sa.String(length=500), nullable=True))
    op.add_column("employees", sa.Column("personal_email", sa.String(length=255), nullable=True))
    op.add_column("employees", sa.Column("gender", sa.String(length=32), nullable=True))
    op.add_column("employees", sa.Column("marital_status", sa.String(length=32), nullable=True))
    op.add_column("employees", sa.Column("bank_account_number", sa.String(length=64), nullable=True))
    op.add_column("employees", sa.Column("bank_name", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("ifsc_code", sa.String(length=32), nullable=True))
    op.add_column("employees", sa.Column("pan_no", sa.String(length=32), nullable=True))
    op.add_column("employees", sa.Column("uid_no", sa.String(length=32), nullable=True))
    op.add_column("employees", sa.Column("emp_code", sa.String(length=64), nullable=True))

    connection = op.get_bind()
    employee_count = connection.execute(sa.text("SELECT COUNT(*) FROM employees")).scalar_one()
    if employee_count:
        connection.execute(
            sa.text(
                """
                INSERT INTO companies (id, name, initials, created_at, updated_at)
                VALUES (gen_random_uuid(), 'Legacy Company', 'LC', now(), now())
                """
            )
        )
        company_id = connection.execute(
            sa.text("SELECT id FROM companies WHERE initials = 'LC' LIMIT 1")
        ).scalar_one()
        connection.execute(
            sa.text(
                """
                UPDATE employees
                SET company_id = :company_id,
                    date_of_joining = COALESCE(date_of_joining, CURRENT_DATE)
                """
            ),
            {"company_id": company_id},
        )

    op.alter_column("employees", "company_id", nullable=False)
    op.alter_column("employees", "date_of_joining", nullable=False)
    op.create_index(op.f("ix_employees_company_id"), "employees", ["company_id"], unique=False)
    op.create_foreign_key(
        "fk_employees_company_id",
        "employees",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("fk_employees_company_id", "employees", type_="foreignkey")
    op.drop_index(op.f("ix_employees_company_id"), table_name="employees")
    op.drop_column("employees", "emp_code")
    op.drop_column("employees", "uid_no")
    op.drop_column("employees", "pan_no")
    op.drop_column("employees", "ifsc_code")
    op.drop_column("employees", "bank_name")
    op.drop_column("employees", "bank_account_number")
    op.drop_column("employees", "marital_status")
    op.drop_column("employees", "gender")
    op.drop_column("employees", "personal_email")
    op.drop_column("employees", "mailing_address")
    op.drop_column("employees", "date_of_birth")
    op.drop_column("employees", "certifications")
    op.drop_column("employees", "skills")
    op.drop_column("employees", "interests")
    op.drop_column("employees", "job_love")
    op.drop_column("employees", "about")
    op.drop_column("employees", "date_of_joining")
    op.drop_column("employees", "company_id")
    op.drop_column("users", "must_change_password")
    op.drop_index(op.f("ix_companies_initials"), table_name="companies")
    op.drop_table("companies")
