from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.operation import OperationType
from src.repositories.category import CategoryRepository
from src.repositories.operation import OperationRepository
from src.schemas.operation import OperationCreate, OperationUpdate


class OperationController:
    def __init__(self, db: AsyncSession):
        self.op_repo = OperationRepository(db)
        self.cat_repo = CategoryRepository(db)

    async def list(
        self,
        user_id: UUID,
        date_from: date | None = None,
        date_to: date | None = None,
        category_id: UUID | None = None,
        min_amount: int | None = None,
        max_amount: int | None = None,
        op_type: OperationType | None = None,
    ):
        return await self.op_repo.list_by_user(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
            category_id=category_id,
            min_amount=min_amount,
            max_amount=max_amount,
            op_type=op_type,
        )

    async def create(self, user_id: UUID, operation_in: OperationCreate):
        if operation_in.category_id is not None:
            category = await self.cat_repo.get(operation_in.category_id)
            if not category or category.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Категория не найдена",
                )

        return await self.op_repo.create(operation_in, user_id=user_id)

    async def update(self, user_id: UUID, operation_id: UUID, operation_in: OperationUpdate):
        operation = await self.op_repo.get(operation_id)
        if not operation or operation.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Операция не найдена")

        if operation_in.category_id is not None:
            category = await self.cat_repo.get(operation_in.category_id)
            if not category or category.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Категория не найдена",
                )

        return await self.op_repo.update(operation, operation_in)

    async def delete(self, user_id: UUID, operation_id: UUID):
        operation = await self.op_repo.get(operation_id)
        if not operation or operation.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Операция не найдена")
        await self.op_repo.delete(operation)
