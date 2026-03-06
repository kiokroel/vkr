from typing import Generic, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

TModel = TypeVar("TModel")
TCreate = TypeVar("TCreate", bound=BaseModel)
TUpdate = TypeVar("TUpdate", bound=BaseModel)


class BaseRepository(Generic[TModel, TCreate, TUpdate]):
    def __init__(self, db: AsyncSession, model: Type[TModel]):
        self.db = db
        self.model = model

    async def get(self, obj_id: UUID) -> TModel | None:
        stmt = select(self.model).where(self.model.id == obj_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, obj_in: TCreate, **extra) -> TModel:
        data = obj_in.model_dump(exclude_unset=True)
        data.update(extra)
        db_obj = self.model(**data)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: TModel, obj_in: TUpdate) -> TModel:
        data = obj_in.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(db_obj, k, v)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: TModel) -> None:
        await self.db.delete(db_obj)
        await self.db.commit()
