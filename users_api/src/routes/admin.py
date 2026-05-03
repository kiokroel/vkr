from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.admin import AdminController
from src.core.database import get_db
from src.dependencies import get_current_admin
from src.models.user import User
from src.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Получить список всех пользователей (только для администраторов)"""
    controller = AdminController(db)
    return await controller.get_all_users(skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Получить информацию о пользователе по ID (только для администраторов)"""
    controller = AdminController(db)
    return await controller.get_user_by_id(user_id)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Обновить данные пользователя (только для администраторов)"""
    controller = AdminController(db)
    return await controller.update_user(user_id, user_update)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Удалить пользователя (только для администраторов). Нельзя удалить самого себя."""
    # Защита от удаления самого себя
    if str(current_admin.id) == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить собственную учетную запись"
        )
    
    controller = AdminController(db)
    await controller.delete_user(user_id)
    return None


@router.patch("/users/{user_id}/admin-status", response_model=UserResponse)
async def toggle_admin_status(
    user_id: UUID,
    is_admin: bool,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Изменить статус администратора у пользователя (только для администраторов). Нельзя снять права с самого себя."""
    # Защита от лишения прав самого себя
    if str(current_admin.id) == str(user_id) and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя снять права администратора с собственной учетной записи"
        )
    
    controller = AdminController(db)
    return await controller.toggle_admin_status(user_id, is_admin)


@router.get("/stats")
async def get_system_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Получить системную статистику (только для администраторов)"""
    controller = AdminController(db)
    
    total_users = await controller.get_users_count()
    total_admins = await controller.get_admins_count()
    
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "regular_users": total_users - total_admins
    }
