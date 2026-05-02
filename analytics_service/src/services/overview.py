from __future__ import annotations

from collections import defaultdict
from datetime import date
from uuid import UUID

from src.repositories.transactions import TransactionRepository
from src.services.forecasting import ForecastingService, add_months, iter_months, latest_completed_month, month_start
from src.services.reports import build_report


class OverviewService:
    def __init__(self, repo: TransactionRepository, forecasting: ForecastingService):
        self.repo = repo
        self.forecasting = forecasting

    async def get_overview(self, user_id: UUID, history_months: int = 12) -> dict:
        today = date.today()
        current_month = month_start(today)
        completed_month = latest_completed_month(today)

        revision = await self.repo.completed_expenses_revision(user_id, before_month=current_month)
        expenses = await self.repo.list_completed_expenses(user_id, before_month=current_month)
        artifact = self.forecasting.load_artifact(user_id)
        if not self.forecasting.is_artifact_current(artifact, completed_month, revision=revision):
            artifact = self.forecasting.train_user(
                user_id,
                expenses,
                completed_month=completed_month,
                revision=revision,
            )

        operations = await self.repo.list_user_operations(user_id)
        totals_by_month = defaultdict(lambda: {"expenses": 0, "income": 0})
        current_expenses = 0
        current_income = 0

        for operation in operations:
            operation_month = month_start(operation["date"])
            amount = int(operation["amount"])
            if operation_month == current_month:
                if operation["type"] == "expense":
                    current_expenses += amount
                else:
                    current_income += amount
            elif operation_month <= completed_month:
                key = "expenses" if operation["type"] == "expense" else "income"
                totals_by_month[operation_month][key] += amount

        history_start = add_months(current_month, -history_months)
        history = [
            {
                "month": item_month.isoformat(),
                "expenses": totals_by_month[item_month]["expenses"],
                "income": totals_by_month[item_month]["income"],
            }
            for item_month in iter_months(history_start, completed_month)
        ]

        return {
            "current_month": {
                "month": current_month.isoformat(),
                "expenses": current_expenses,
                "income": current_income,
            },
            "history": history,
            "forecast": {
                "month": artifact["forecast_month"],
                "predicted_expenses": artifact["total_predicted_expenses"],
                "algorithm": artifact["algorithm"],
                "trained_at": artifact["trained_at"],
                "training_rows": artifact["training_rows"],
                "features": artifact["features"],
                "detail": artifact["detail"],
            },
            "categories": artifact["categories"],
            "report": build_report(current_expenses, artifact),
        }
