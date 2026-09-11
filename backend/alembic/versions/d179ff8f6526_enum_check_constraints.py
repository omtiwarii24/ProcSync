"""enum check constraints

Revision ID: d179ff8f6526
Revises: dbe0fd002137
Create Date: 2026-09-10 19:34:13.754626

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd179ff8f6526'
down_revision: Union[str, None] = 'dbe0fd002137'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint("ck_audit_logs_action", "audit_logs",
        "action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGIN_FAILED','WAIVE','AUTHORIZE','REJECT','VALIDATE','SELECT','COMPUTE','PUBLISH','CLOSE','INVOICE','APPROVE','DISBURSE','FINALIZE','RESOLVE')")
    op.create_check_constraint("ck_users_role", "users",
        "role IN ('STARTUP','DEPT_OWNER','PILOT_MANAGER','EVALUATOR','PROCUREMENT_AUTHORITY','FINANCE','ADMIN')")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_constraint("ck_audit_logs_action", "audit_logs", type_="check")
