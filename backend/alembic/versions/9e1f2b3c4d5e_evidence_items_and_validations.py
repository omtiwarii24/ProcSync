"""evidence items and validations

Revision ID: 9e1f2b3c4d5e
Revises: 7c1d9a4e2f08
Create Date: 2026-09-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e1f2b3c4d5e'
down_revision: Union[str, None] = '7c1d9a4e2f08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Hand-authored (mirrors autogenerate output for sa_enum columns
    # exactly): evidence_items with EvidenceType + ValidationStatus CHECK
    # constraints and frozen FK names; validations with frozen FK names.
    # No fk_audit_logs_user_id drift.
    op.create_table('evidence_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pilot_id', sa.Integer(), nullable=False),
    sa.Column('milestone_id', sa.Integer(), nullable=True),
    sa.Column('kpi_id', sa.Integer(), nullable=True),
    sa.Column('evidence_type', sa.Enum('KPI_MEASUREMENT', 'COST_RECORD', 'PHOTO', 'LOG', 'REPORT', name='evidencetype', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.String(length=512), nullable=False),
    sa.Column('uploaded_by', sa.Integer(), nullable=False),
    sa.Column('status', sa.Enum('UNVERIFIED', 'AI_EXTRACTED', 'EVALUATOR_VERIFIED', 'REJECTED', name='validationstatus', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('extracted_data', sa.JSON(), nullable=True),
    sa.Column('ai_confidence', sa.Float(), nullable=True),
    sa.Column('source_trace', sa.JSON(), nullable=True),
    sa.Column('safety_critical', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['kpi_id'], ['kpis.id'], name='fk_evidence_kpi'),
    sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], name='fk_evidence_milestone'),
    sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], name='fk_evidence_pilot'),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], name='fk_evidence_uploader'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evidence_items_pilot_id'), 'evidence_items', ['pilot_id'], unique=False)
    op.create_table('validations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('evidence_item_id', sa.Integer(), nullable=False),
    sa.Column('validator_id', sa.Integer(), nullable=True),
    sa.Column('verdict', sa.String(length=10), nullable=False),
    sa.Column('method', sa.String(length=30), nullable=False),
    sa.Column('auto_approved', sa.Boolean(), nullable=False),
    sa.Column('notes', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['evidence_item_id'], ['evidence_items.id'], name='fk_validations_evidence'),
    sa.ForeignKeyConstraint(['validator_id'], ['users.id'], name='fk_validations_validator'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_validations_evidence_item_id'), 'validations', ['evidence_item_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_validations_evidence_item_id'), table_name='validations')
    op.drop_table('validations')
    op.drop_index(op.f('ix_evidence_items_pilot_id'), table_name='evidence_items')
    op.drop_table('evidence_items')
