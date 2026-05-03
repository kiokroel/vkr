import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings

# Основная БД (operations, categories)
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=settings.database_settings.db_pool_size,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# БД пользователей (users) - для проверки is_admin
USERS_DATABASE_URL = os.getenv(
    "USERS_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@db_users:5432/postgres"
)

users_engine = create_async_engine(
    USERS_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
)

UsersSessionLocal = async_sessionmaker(
    users_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_users_db() -> AsyncGenerator[AsyncSession, None]:
    """Получить сессию для БД пользователей"""
    async with UsersSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
