"""execution milestones kpis risks constraints

Revision ID: 5a6f1e9c6406
Revises: b81c2d4e5f6a
Create Date: 2026-09-11 07:49:05.015175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a6f1e9c6406'
down_revision: Union[str, None] = 'b81c2d4e5f6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Hand-authored (autogenerate sees no new metadata: Task I must not touch
    # alembic/env.py, so execution models are invisible to it; rendering
    # mirrors autogenerate output for sa_enum columns exactly).
    # Milestone status CHECK present; KPI direction is plain String(6) with
    # pydantic-Literal validation at the schema boundary — NO CHECK expected.
    op.create_table('milestones',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pilot_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'SUBMITTED', 'VERIFIED', 'PAID', name='milestonestatus', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('safety_critical', sa.Boolean(), nullable=False),
    sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], name='fk_milestones_pilot'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_milestones_pilot_id'), 'milestones', ['pilot_id'], unique=False)
    op.create_table('kpis',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pilot_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('definition', sa.Text(), nullable=False),
    sa.Column('unit', sa.String(length=50), nullable=False),
    sa.Column('baseline', sa.Float(), nullable=False),
    sa.Column('target', sa.Float(), nullable=False),
    sa.Column('actual', sa.Float(), nullable=True),
    sa.Column('direction', sa.String(length=6), nullable=False),
    sa.Column('safety_critical', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], name='fk_kpis_pilot'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kpis_pilot_id'), 'kpis', ['pilot_id'], unique=False)
    op.create_table('risks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pilot_id', sa.Integer(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('likelihood', sa.String(length=10), nullable=False),
    sa.Column('impact', sa.String(length=10), nullable=False),
    sa.Column('mitigation', sa.Text(), nullable=False),
    sa.Column('residual', sa.Text(), nullable=False),
    sa.Column('is_critical', sa.Boolean(), nullable=False),
    sa.Column('resolved', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], name='fk_risks_pilot'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_risks_pilot_id'), 'risks', ['pilot_id'], unique=False)
    op.create_table('constraints',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pilot_id', sa.Integer(), nullable=False),
    sa.Column('constraint_type', sa.Enum('CONNECTIVITY', 'POWER', 'STAFFING', 'DATA_ACCESS', 'OTHER', name='constrainttype', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('context_value', sa.Text(), nullable=False),
    sa.Column('notes', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], name='fk_constraints_pilot'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_constraints_pilot_id'), 'constraints', ['pilot_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_constraints_pilot_id'), table_name='constraints')
    op.drop_table('constraints')
    op.drop_index(op.f('ix_risks_pilot_id'), table_name='risks')
    op.drop_table('risks')
    op.drop_index(op.f('ix_kpis_pilot_id'), table_name='kpis')
    op.drop_table('kpis')
    op.drop_index(op.f('ix_milestones_pilot_id'), table_name='milestones')
    op.drop_table('milestones')
