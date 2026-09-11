"""risk equivalent analyses

Revision ID: 4f2a1c9d77e0
Revises: 3ed32cad4a33
Create Date: 2026-09-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f2a1c9d77e0'
down_revision: Union[str, None] = '3ed32cad4a33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('risk_equivalent_analyses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('proposal_id', sa.Integer(), nullable=False),
    sa.Column('criterion_id', sa.Integer(), nullable=False),
    sa.Column('underlying_risk', sa.Text(), nullable=False),
    sa.Column('alternative_evidence', sa.JSON(), nullable=False),
    sa.Column('residual_risk', sa.String(length=10), nullable=False),
    sa.Column('safeguards', sa.JSON(), nullable=False),
    sa.Column('ai_enrichment', sa.JSON(), nullable=True),
    sa.Column('human_decision', sa.Enum('PENDING', 'ACCEPTED', 'REJECTED', name='riskequivalentdecision', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('decided_by', sa.Integer(), nullable=True),
    sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['criterion_id'], ['eligibility_criteria.id'], name='fk_riskqual_criterion'),
    sa.ForeignKeyConstraint(['decided_by'], ['users.id'], name='fk_riskqual_decider'),
    sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], name='fk_riskqual_proposal'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('proposal_id', 'criterion_id', name='uq_riskqual_proposal_criterion')
    )
    op.create_index(op.f('ix_risk_equivalent_analyses_proposal_id'), 'risk_equivalent_analyses', ['proposal_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_risk_equivalent_analyses_proposal_id'), table_name='risk_equivalent_analyses')
    op.drop_table('risk_equivalent_analyses')
