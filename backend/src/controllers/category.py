from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.category import CategoryRepository
from src.schemas.category import CategoryCreate, CategoryUpdate


class CategoryController:
    def __init__(self, db: AsyncSession):
        self.repo = CategoryRepository(db)

    async def list(self, user_id: UUID):
        return await self.repo.list_by_user(user_id)

    async def create(self, user_id: UUID, category_in: CategoryCreate):
        return await self.repo.create(category_in, user_id=user_id)

    async def update(self, user_id: UUID, category_id: UUID, category_in: CategoryUpdate):
        category = await self.repo.get(category_id)
        if not category or category.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена")
        return await self.repo.update(category, category_in)

    async def delete(self, user_id: UUID, category_id: UUID):
        category = await self.repo.get(category_id)
        if not category or category.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена")
        await self.repo.delete(category)
