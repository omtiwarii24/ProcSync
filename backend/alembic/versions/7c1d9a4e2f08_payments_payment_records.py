"""payments payment records

Revision ID: 7c1d9a4e2f08
Revises: 5a6f1e9c6406
Create Date: 2026-09-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c1d9a4e2f08'
down_revision: Union[str, None] = '5a6f1e9c6406'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Hand-authored (mirrors autogenerate output for sa_enum columns
    # exactly): payments table with PaymentStatus CHECK constraint, unique
    # milestone link, and named user FKs. No fk_audit_logs_user_id drift.
    op.create_table('payments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('milestone_id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('status', sa.Enum('PENDING', 'INVOICED', 'APPROVED', 'DISBURSED', 'REJECTED', name='paymentstatus', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('invoiced_by', sa.Integer(), nullable=False),
    sa.Column('approved_by', sa.Integer(), nullable=True),
    sa.Column('rejected_reason', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], name='fk_payments_approved_by'),
    sa.ForeignKeyConstraint(['invoiced_by'], ['users.id'], name='fk_payments_invoiced_by'),
    sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], name='fk_payments_milestone'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('milestone_id', name='uq_payment_milestone')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('payments')
