from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.category import Category
from src.repositories.base import BaseRepository
from src.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Category)

    async def list_by_user(self, user_id: UUID) -> list[Category]:
        stmt = select(Category).where(Category.user_id == user_id).order_by(Category.name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
