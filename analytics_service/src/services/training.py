from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from src.core.config import settings
from src.core.database import AsyncSessionLocal
from src.repositories.transactions import TransactionRepository
from src.services.forecasting import ForecastingService, latest_completed_month, month_start

logger = logging.getLogger(__name__)


async def train_user_if_needed(repo: TransactionRepository, forecasting: ForecastingService, user_id) -> dict:
    current_month = month_start(datetime.now().date())
    completed_month = latest_completed_month()
    revision = await repo.completed_expenses_revision(user_id, before_month=current_month)
    artifact = forecasting.load_artifact(user_id)
    if forecasting.is_artifact_current(artifact, completed_month, revision=revision):
        return artifact

    expenses = await repo.list_completed_expenses(user_id, before_month=current_month)
    return forecasting.train_user(user_id, expenses, completed_month=completed_month, revision=revision)


async def train_all_users_if_needed() -> int:
    forecasting = ForecastingService(settings.analytics_settings.model_dir)
    async with AsyncSessionLocal() as db:
        repo = TransactionRepository(db)
        user_ids = await repo.list_users_with_expenses()
        for user_id in user_ids:
            await train_user_if_needed(repo, forecasting, user_id)
        return len(user_ids)


async def monthly_training_loop() -> None:
    if settings.analytics_settings.train_on_startup:
        try:
            await train_all_users_if_needed()
        except Exception:
            logger.exception("Initial analytics model training failed")

    while True:
        now = datetime.now()
        next_run = now.replace(
            hour=settings.analytics_settings.daily_train_hour,
            minute=10,
            second=0,
            microsecond=0,
        )
        if next_run <= now:
            next_run += timedelta(days=1)

        await asyncio.sleep((next_run - now).total_seconds())
        try:
            await train_all_users_if_needed()
        except Exception:
            logger.exception("Scheduled analytics model training failed")
