"""pilots table

Revision ID: b81c2d4e5f6a
Revises: 4f2a1c9d77e0
Create Date: 2026-09-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b81c2d4e5f6a'
down_revision: Union[str, None] = '4f2a1c9d77e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('pilots',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('proposal_id', sa.Integer(), nullable=False),
    sa.Column('department_id', sa.Integer(), nullable=False),
    sa.Column('startup_id', sa.Integer(), nullable=False),
    sa.Column('pilot_manager_id', sa.Integer(), nullable=False),
    sa.Column('scope', sa.Text(), nullable=False),
    sa.Column('status', sa.Enum('DRAFT', 'ACTIVE', 'COMPLETED', 'FAILED', 'TERMINATED', name='pilotstatus', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('terms_accepted', sa.Boolean(), nullable=False),
    sa.Column('data_ip_terms', sa.Text(), nullable=False),
    sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('failure_conditions', sa.Text(), nullable=True),
    sa.Column('lessons_draft', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], name='fk_pilots_department'),
    sa.ForeignKeyConstraint(['pilot_manager_id'], ['users.id'], name='fk_pilots_manager'),
    sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], name='fk_pilots_proposal'),
    sa.ForeignKeyConstraint(['startup_id'], ['startups.id'], name='fk_pilots_startup'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('proposal_id', name='uq_pilot_proposal')
    )
    op.create_index(op.f('ix_pilots_department_id'), 'pilots', ['department_id'], unique=False)
    op.create_index(op.f('ix_pilots_pilot_manager_id'), 'pilots', ['pilot_manager_id'], unique=False)
    op.create_index(op.f('ix_pilots_proposal_id'), 'pilots', ['proposal_id'], unique=False)
    op.create_index(op.f('ix_pilots_startup_id'), 'pilots', ['startup_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_pilots_startup_id'), table_name='pilots')
    op.drop_index(op.f('ix_pilots_proposal_id'), table_name='pilots')
    op.drop_index(op.f('ix_pilots_pilot_manager_id'), table_name='pilots')
    op.drop_index(op.f('ix_pilots_department_id'), table_name='pilots')
    op.drop_table('pilots')
