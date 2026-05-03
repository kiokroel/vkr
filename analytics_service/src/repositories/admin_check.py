from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AdminCheckRepository:
    """Репозиторий для проверки прав администратора через БД users"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_is_admin(self, user_id: UUID) -> bool:
        """Проверить, является ли пользователь администратором"""
        query = text("SELECT is_admin FROM users WHERE id = :user_id")
        result = await self.db.execute(query, {"user_id": str(user_id)})
        row = result.fetchone()
        
        if not row:
            return False
        
        return bool(row[0])
