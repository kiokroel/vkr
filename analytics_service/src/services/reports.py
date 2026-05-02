from __future__ import annotations


def build_report(current_month_expenses: int, forecast: dict) -> dict:
    predicted = int(forecast.get("total_predicted_expenses") or 0)
    categories = forecast.get("categories") or []

    if predicted == 0:
        summary = "Недостаточно данных для содержательного прогноза расходов."
    elif current_month_expenses > predicted:
        summary = "Текущие расходы уже выше прогнозного уровня, стоит проверить крупные категории."
    else:
        summary = "Прогноз построен по истории расходов и готов для планирования бюджета."

    risks = []
    for category in categories:
        rolling = int(category.get("rolling_mean_3") or 0)
        predicted_amount = int(category.get("predicted_amount") or 0)
        if rolling > 0 and predicted_amount > rolling * 1.2:
            risks.append(
                f"{category['category_name']}: прогноз выше среднего за 3 месяца на {predicted_amount - rolling}"
            )

    return {"summary": summary, "risks": risks[:5]}
