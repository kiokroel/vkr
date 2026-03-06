from datetime import date
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.operation import Operation, OperationType
from src.repositories.base import BaseRepository
from src.schemas.operation import OperationCreate, OperationUpdate


class OperationRepository(BaseRepository[Operation, OperationCreate, OperationUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Operation)

    async def list_by_user(
        self,
        user_id: UUID,
        date_from: date | None = None,
        date_to: date | None = None,
        category_id: UUID | None = None,
        min_amount: int | None = None,
        max_amount: int | None = None,
        op_type: OperationType | None = None,
    ) -> list[Operation]:
        conditions = [Operation.user_id == user_id]

        if date_from:
            conditions.append(Operation.date >= date_from)
        if date_to:
            conditions.append(Operation.date <= date_to)
        if category_id:
            conditions.append(Operation.category_id == category_id)
        if min_amount is not None:
            conditions.append(Operation.amount >= min_amount)
        if max_amount is not None:
            conditions.append(Operation.amount <= max_amount)
        if op_type:
            conditions.append(Operation.type == op_type)

        stmt = select(Operation).where(and_(*conditions)).order_by(Operation.date.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
