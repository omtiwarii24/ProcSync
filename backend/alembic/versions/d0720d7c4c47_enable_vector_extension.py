"""enable vector extension

Revision ID: d0720d7c4c47
Revises: d179ff8f6526
Create Date: 2026-09-10 19:35:14.703088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0720d7c4c47'
down_revision: Union[str, None] = 'd179ff8f6526'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP EXTENSION IF EXISTS vector;")
