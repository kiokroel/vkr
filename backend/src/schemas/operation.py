from datetime import date
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OperationType(str, Enum):
    income = "income"
    expense = "expense"


class OperationBase(BaseModel):
    date: date
    amount: int
    description: Optional[str] = Field(default=None, max_length=255)
    type: OperationType
    category_id: Optional[UUID] = None


class OperationCreate(OperationBase):
    pass


class OperationUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[int] = None
    description: Optional[str] = Field(default=None, max_length=255)
    type: Optional[OperationType] = None
    category_id: Optional[UUID] = None


class OperationResponse(OperationBase):
    id: UUID

    model_config = {"from_attributes": True}
