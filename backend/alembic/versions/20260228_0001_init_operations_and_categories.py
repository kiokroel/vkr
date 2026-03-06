"""init operations and categories

Revision ID: 20260228_0001
Revises: 
Create Date: 2026-02-28

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260228_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_categories_user_id", "categories", ["user_id"], unique=False)

    operation_type_enum_create = postgresql.ENUM(
        "income", "expense", name="operation_type"
    )
    operation_type_enum_create.create(op.get_bind(), checkfirst=True)

    operation_type_enum = postgresql.ENUM(
        "income", "expense", name="operation_type", create_type=False
    )

    op.create_table(
        "operations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("type", operation_type_enum, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_operations_user_id", "operations", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_operations_user_id", table_name="operations")
    op.drop_table("operations")

    operation_type_enum = postgresql.ENUM("income", "expense", name="operation_type")
    operation_type_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_index("ix_categories_user_id", table_name="categories")
    op.drop_table("categories")
