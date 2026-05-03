from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.user import UserRepository
from src.schemas.user import UserResponse, UserUpdate


class AdminController:
    """Контроллер для административных операций"""

    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        """Получить список всех пользователей"""
        users = await self.user_repo.get_all(skip=skip, limit=limit)
        return users

    async def get_user_by_id(self, user_id: UUID) -> Optional[UserResponse]:
        """Получить пользователя по ID"""
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        return user

    async def update_user(self, user_id: UUID, user_update: UserUpdate) -> UserResponse:
        """Обновить данные пользователя (админ)"""
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )

        if user_update.email and user_update.email != user.email:
            if await self.user_repo.get_by_email(user_update.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email уже используется"
                )

        if user_update.username and user_update.username != user.username:
            if await self.user_repo.get_by_username(user_update.username):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username уже используется"
                )

        updated_user = await self.user_repo.update(user, user_update)
        return updated_user

    async def delete_user(self, user_id: UUID) -> bool:
        """Удалить пользователя"""
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Запрещаем удалять самого себя через эту функцию (дополнительная проверка в роуте)
        await self.user_repo.delete(user_id)
        return True

    async def toggle_admin_status(self, user_id: UUID, is_admin: bool) -> UserResponse:
        """Изменить статус администратора у пользователя"""
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        user.is_admin = is_admin
        await self.user_repo.db.commit()
        await self.user_repo.db.refresh(user)
        return user

    async def get_users_count(self) -> int:
        """Получить общее количество пользователей"""
        from sqlalchemy import func
        from sqlalchemy import select
        
        stmt = select(func.count()).select_from(self.user_repo.model)
        result = await self.user_repo.db.execute(stmt)
        return result.scalar()

    async def get_admins_count(self) -> int:
        """Получить количество администраторов"""
        from sqlalchemy import func
        from sqlalchemy import select
        from src.models.user import User
        
        stmt = select(func.count()).where(User.is_admin == True)
        result = await self.user_repo.db.execute(stmt)
        return result.scalar()
