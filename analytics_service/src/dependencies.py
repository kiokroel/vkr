from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db, get_users_db
from src.core.security import security_service
from src.repositories.admin_check import AdminCheckRepository

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UUID:
    user_id_str = security_service.decode_token(credentials.credentials)
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")

    try:
        return UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный формат ID пользователя")


async def get_current_admin_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    users_db: AsyncSession = Depends(get_users_db),
) -> UUID:
    user_id = await get_current_user_id(credentials)
    
    # Проверяем, является ли пользователь администратором через БД users
    admin_repo = AdminCheckRepository(users_db)
    is_admin = await admin_repo.check_is_admin(user_id)
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора"
        )
    
    return user_id
