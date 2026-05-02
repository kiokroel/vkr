from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.dependencies import get_current_user_id
from src.repositories.transactions import TransactionRepository
from src.schemas.analytics import AnalyticsOverview
from src.services.forecasting import ForecastingService, latest_completed_month, month_start
from src.services.overview import OverviewService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def overview(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    history_months: int = Query(default=12, ge=3, le=36),
):
    repo = TransactionRepository(db)
    forecasting = ForecastingService(settings.analytics_settings.model_dir)
    service = OverviewService(repo, forecasting)
    return await service.get_overview(user_id=user_id, history_months=history_months)


@router.post("/train")
async def train_current_user(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    repo = TransactionRepository(db)
    forecasting = ForecastingService(settings.analytics_settings.model_dir)
    current_month = month_start()
    expenses = await repo.list_completed_expenses(user_id, before_month=current_month)
    artifact = forecasting.train_user(user_id, expenses, completed_month=latest_completed_month())
    return {
        "status": "ok",
        "forecast_month": artifact["forecast_month"],
        "algorithm": artifact["algorithm"],
        "training_rows": artifact["training_rows"],
        "trained_at": artifact["trained_at"],
    }
