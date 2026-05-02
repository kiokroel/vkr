from datetime import date
from datetime import datetime
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_user_operations(self, user_id: UUID) -> list[dict]:
        stmt = text(
            """
            select
                o.date,
                o.amount,
                o.type::text as type,
                o.category_id,
                coalesce(c.name, 'Без категории') as category_name
            from operations o
            left join categories c on c.id = o.category_id
            where o.user_id = :user_id
            order by o.date asc
            """
        )
        result = await self.db.execute(stmt, {"user_id": user_id})
        return [dict(row._mapping) for row in result]

    async def list_completed_expenses(self, user_id: UUID, before_month: date) -> list[dict]:
        stmt = text(
            """
            select
                o.date,
                o.amount,
                o.category_id,
                coalesce(c.name, 'Без категории') as category_name
            from operations o
            left join categories c on c.id = o.category_id
            where o.user_id = :user_id
              and o.type = 'expense'
              and o.date < :before_month
            order by o.date asc
            """
        )
        result = await self.db.execute(stmt, {"user_id": user_id, "before_month": before_month})
        return [dict(row._mapping) for row in result]

    async def completed_expenses_revision(self, user_id: UUID, before_month: date) -> str | None:
        stmt = text(
            """
            select max(o.updated_at) as updated_at
            from operations o
            where o.user_id = :user_id
              and o.type = 'expense'
              and o.date < :before_month
            """
        )
        result = await self.db.execute(stmt, {"user_id": user_id, "before_month": before_month})
        row = result.first()
        if not row:
            return None
        updated_at: datetime | None = row._mapping.get("updated_at")
        return updated_at.isoformat() if updated_at else None

    async def list_users_with_expenses(self) -> list[UUID]:
        stmt = text(
            """
            select distinct user_id
            from operations
            where type = 'expense'
            """
        )
        result = await self.db.execute(stmt)
        return [row._mapping["user_id"] for row in result]
