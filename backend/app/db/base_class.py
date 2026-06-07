from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """SQLAlchemy 2.x declarative base for all ORM models."""

    @declared_attr.directive
    def __tablename__(cls) -> str:  # noqa: N805
        # Auto-generate snake_case table names from class names
        import re

        name = cls.__name__
        return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()
