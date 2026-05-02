from typing import Optional

from pydantic import BaseModel


class MonthTotals(BaseModel):
    month: str
    expenses: int
    income: int


class ForecastInfo(BaseModel):
    month: str
    predicted_expenses: int
    algorithm: str
    trained_at: str
    training_rows: int
    features: list[str]
    detail: str


class CategoryForecast(BaseModel):
    category_id: Optional[str] = None
    category_name: str
    predicted_amount: int
    previous_month_amount: int
    rolling_mean_3: int


class ReportInfo(BaseModel):
    summary: str
    risks: list[str]


class AnalyticsOverview(BaseModel):
    current_month: MonthTotals
    history: list[MonthTotals]
    forecast: ForecastInfo
    categories: list[CategoryForecast]
    report: ReportInfo
