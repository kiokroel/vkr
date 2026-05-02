from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import mean
from uuid import UUID

import joblib

FEATURE_NAMES = ["category_id", "month_num", "lag_1", "lag_2", "lag_3", "rolling_mean_3"]


def month_start(value: date | None = None) -> date:
    value = value or date.today()
    return date(value.year, value.month, 1)


def add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def iter_months(start: date, end: date) -> list[date]:
    months = []
    cursor = month_start(start)
    end = month_start(end)
    while cursor <= end:
        months.append(cursor)
        cursor = add_months(cursor, 1)
    return months


def latest_completed_month(today: date | None = None) -> date:
    current_month = month_start(today or date.today())
    return add_months(current_month, -1)


class ForecastingService:
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)

    def artifact_path(self, user_id: UUID) -> Path:
        return self.model_dir / f"{user_id}.joblib"

    def load_artifact(self, user_id: UUID) -> dict | None:
        path = self.artifact_path(user_id)
        if not path.exists():
            return None
        return joblib.load(path)

    def save_artifact(self, user_id: UUID, artifact: dict) -> dict:
        joblib.dump(artifact, self.artifact_path(user_id))
        return artifact

    def is_artifact_current(
        self,
        artifact: dict | None,
        completed_month: date,
        revision: str | None = None,
    ) -> bool:
        if not artifact:
            return False
        if artifact.get("last_completed_month") != completed_month.isoformat():
            return False

        if revision is None:
            return True

        return artifact.get("completed_expenses_revision") == revision

    def train_user(
        self,
        user_id: UUID,
        expenses: list[dict],
        completed_month: date | None = None,
        revision: str | None = None,
    ) -> dict:
        completed_month = completed_month or latest_completed_month()
        forecast_month = add_months(completed_month, 1)

        if not expenses:
            return self.save_artifact(
                user_id,
                self._empty_artifact(
                    forecast_month=forecast_month,
                    completed_month=completed_month,
                    revision=revision,
                    detail="Недостаточно расходных операций для обучения модели.",
                ),
            )

        first_month = min(month_start(item["date"]) for item in expenses)
        all_months = iter_months(first_month, completed_month)

        category_names: dict[str | None, str] = {}
        by_category_month: dict[str | None, dict[date, int]] = defaultdict(lambda: defaultdict(int))

        for item in expenses:
            item_month = month_start(item["date"])
            if item_month > completed_month:
                continue
            category_id = str(item["category_id"]) if item["category_id"] is not None else None
            category_names[category_id] = item["category_name"]
            by_category_month[category_id][item_month] += int(item["amount"])

        if not category_names:
            return self.save_artifact(
                user_id,
                self._empty_artifact(
                    forecast_month=forecast_month,
                    completed_month=completed_month,
                    revision=revision,
                    detail="Нет завершенных месяцев с расходами для обучения модели.",
                ),
            )

        category_ids = sorted(category_names, key=lambda value: value or "")
        category_codes = {category_id: index for index, category_id in enumerate(category_ids)}

        feature_rows: list[list[float]] = []
        target_rows: list[float] = []
        prediction_rows: list[list[float]] = []
        prediction_meta: list[dict] = []

        for category_id in category_ids:
            monthly_amounts = [by_category_month[category_id].get(month, 0) for month in all_months]

            for index in range(3, len(all_months)):
                lag_1 = monthly_amounts[index - 1]
                lag_2 = monthly_amounts[index - 2]
                lag_3 = monthly_amounts[index - 3]
                feature_rows.append(
                    [
                        float(category_codes[category_id]),
                        float(all_months[index].month),
                        float(lag_1),
                        float(lag_2),
                        float(lag_3),
                        float(mean([lag_1, lag_2, lag_3])),
                    ]
                )
                target_rows.append(float(monthly_amounts[index]))

            lag_values = [0, 0, 0]
            for offset in range(3):
                month_index = len(all_months) - 1 - offset
                if month_index >= 0:
                    lag_values[offset] = monthly_amounts[month_index]

            rolling_mean_3 = float(mean(lag_values))
            prediction_rows.append(
                [
                    float(category_codes[category_id]),
                    float(forecast_month.month),
                    float(lag_values[0]),
                    float(lag_values[1]),
                    float(lag_values[2]),
                    rolling_mean_3,
                ]
            )
            prediction_meta.append(
                {
                    "category_id": category_id,
                    "category_name": category_names[category_id],
                    "previous_month_amount": int(lag_values[0]),
                    "rolling_mean_3": int(round(rolling_mean_3)),
                }
            )

        algorithm = "rolling_mean_3"
        detail = "Истории пока мало для Random Forest, использовано скользящее среднее за 3 месяца."
        model = None
        predictions = [row[-1] for row in prediction_rows]

        if len(feature_rows) >= max(8, len(category_ids) * 2):
            from sklearn.ensemble import RandomForestRegressor

            model = RandomForestRegressor(n_estimators=200, random_state=42, min_samples_leaf=1)
            model.fit(feature_rows, target_rows)
            predictions = model.predict(prediction_rows).tolist()
            algorithm = "random_forest_regressor"
            detail = "Модель обучена по статье: лаги, скользящее среднее, номер месяца и Random Forest."

        categories = []
        for meta, predicted in zip(prediction_meta, predictions):
            predicted_amount = max(0, int(round(predicted)))
            if predicted_amount == 0 and meta["previous_month_amount"] == 0 and meta["rolling_mean_3"] == 0:
                continue
            categories.append({**meta, "predicted_amount": predicted_amount})

        categories.sort(key=lambda item: item["predicted_amount"], reverse=True)

        artifact = {
            "user_id": str(user_id),
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "last_completed_month": completed_month.isoformat(),
            "completed_expenses_revision": revision,
            "forecast_month": forecast_month.isoformat(),
            "algorithm": algorithm,
            "features": FEATURE_NAMES,
            "training_rows": len(feature_rows),
            "category_codes": category_codes,
            "categories": categories,
            "total_predicted_expenses": sum(item["predicted_amount"] for item in categories),
            "detail": detail,
            "model": model,
        }
        return self.save_artifact(user_id, artifact)

    def _empty_artifact(self, forecast_month: date, completed_month: date, revision: str | None, detail: str) -> dict:
        return {
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "last_completed_month": completed_month.isoformat(),
            "completed_expenses_revision": revision,
            "forecast_month": forecast_month.isoformat(),
            "algorithm": "not_enough_data",
            "features": FEATURE_NAMES,
            "training_rows": 0,
            "category_codes": {},
            "categories": [],
            "total_predicted_expenses": 0,
            "detail": detail,
            "model": None,
        }
