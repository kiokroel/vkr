from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.operation import OperationController
from src.core.database import get_db
from src.dependencies import get_current_user_id
from src.models.operation import OperationType
from src.schemas.operation import OperationCreate, OperationResponse, OperationUpdate

router = APIRouter(prefix="/api/operations", tags=["operations"])


@router.get("/", response_model=list[OperationResponse])
async def list_operations(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    category_id: UUID | None = Query(default=None),
    min_amount: int | None = Query(default=None),
    max_amount: int | None = Query(default=None),
    op_type: OperationType | None = Query(default=None, alias="type"),
):
    controller = OperationController(db)
    return await controller.list(
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        category_id=category_id,
        min_amount=min_amount,
        max_amount=max_amount,
        op_type=op_type,
    )


@router.post("/", response_model=OperationResponse, status_code=status.HTTP_201_CREATED)
async def create_operation(
    payload: OperationCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    controller = OperationController(db)
    return await controller.create(user_id, payload)


@router.patch("/{operation_id}", response_model=OperationResponse)
async def update_operation(
    operation_id: UUID,
    payload: OperationUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    controller = OperationController(db)
    return await controller.update(user_id, operation_id, payload)


@router.delete("/{operation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_operation(
    operation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    controller = OperationController(db)
    await controller.delete(user_id, operation_id)
    return None
