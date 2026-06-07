"""Initial V1 migration — creates all tables.

Revision ID: 001
Revises:
Create Date: 2026-06-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("language_preference", sa.String(10), nullable=False, server_default="en"),
        sa.Column("interests", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("password_reset_token", sa.String(255), nullable=True),
        sa.Column("password_reset_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_password_reset_token", "users", ["password_reset_token"])

    # ── communities ────────────────────────────────────────────
    op.create_table(
        "communities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("banner_url", sa.String(500), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_communities_id", "communities", ["id"])
    op.create_index("ix_communities_slug", "communities", ["slug"], unique=True)

    # ── community_members ──────────────────────────────────────
    op.create_table(
        "community_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("community_id", sa.Integer(), sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("community_id", "user_id", name="uq_community_member"),
    )
    op.create_index("ix_community_members_id", "community_members", ["id"])

    # ── posts ──────────────────────────────────────────────────
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("community_id", sa.Integer(), sa.ForeignKey("communities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_type", sa.String(20), nullable=False, server_default="text"),
        sa.Column("image_urls", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_posts_id", "posts", ["id"])
    op.create_index("ix_posts_author_id", "posts", ["author_id"])
    op.create_index("ix_posts_community_id", "posts", ["community_id"])
    op.create_index("ix_posts_parent_id", "posts", ["parent_id"])
    op.create_index("ix_posts_created_at", "posts", ["created_at"])

    # ── reactions ──────────────────────────────────────────────
    op.create_table(
        "reactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reaction_type", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "post_id", name="uq_user_post_reaction"),
    )
    op.create_index("ix_reactions_id", "reactions", ["id"])
    op.create_index("ix_reactions_user_id", "reactions", ["user_id"])
    op.create_index("ix_reactions_post_id", "reactions", ["post_id"])

    # ── notifications ──────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipient_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("notification_type", sa.String(50), nullable=False),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True),
        sa.Column("community_id", sa.Integer(), sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_id", "notifications", ["id"])
    op.create_index("ix_notifications_recipient_id", "notifications", ["recipient_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("reactions")
    op.drop_table("posts")
    op.drop_table("community_members")
    op.drop_table("communities")
    op.drop_table("users")
