from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession


class SystemStatsRepository:
    """Репозиторий для сбора системной статистики"""

    def __init__(self, db: AsyncSession, users_db: AsyncSession = None):
        self.db = db  # БД operations, categories
        self.users_db = users_db  # БД users (опционально)

    async def get_total_users(self) -> int:
        """Общее количество пользователей"""
        if not self.users_db:
            return 0
        query = text("SELECT COUNT(*) FROM users")
        result = await self.users_db.execute(query)
        return result.scalar() or 0

    async def get_total_admins(self) -> int:
        """Количество администраторов"""
        if not self.users_db:
            return 0
        query = text("SELECT COUNT(*) FROM users WHERE is_admin = true")
        result = await self.users_db.execute(query)
        return result.scalar() or 0

    async def get_active_users_today(self) -> int:
        """Количество активных пользователей за сегодня"""
        today = datetime.now().date()
        query = text("""
            SELECT COUNT(DISTINCT user_id) 
            FROM operations 
            WHERE DATE(created_at) = :today
        """)
        result = await self.db.execute(query, {"today": today})
        return result.scalar() or 0

    async def get_operations_count(self) -> dict:
        """Статистика операций"""
        query = text("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
                COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
            FROM operations
        """)
        result = await self.db.execute(query)
        row = result.fetchone()
        return {
            "total_operations": row[0] or 0,
            "income_operations": row[1] or 0,
            "expense_operations": row[2] or 0,
            "total_income_amount": float(row[3]) if row[3] else 0,
            "total_expense_amount": float(row[4]) if row[4] else 0,
        }

    async def get_monthly_stats(self, months: int = 6) -> list[dict]:
        """Статистика по месяцам"""
        query = text("""
            SELECT 
                DATE_TRUNC('month', date) as month,
                COUNT(*) as operation_count,
                COUNT(DISTINCT user_id) as active_users,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM operations
            WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - (:months * INTERVAL '1 month')
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY month DESC
        """)
        result = await self.db.execute(query, {"months": months})
        rows = result.fetchall()
        return [
            {
                "month": row[0].strftime("%Y-%m") if row[0] else None,
                "operation_count": row[1],
                "active_users": row[2],
                "income": float(row[3]) if row[3] else 0,
                "expense": float(row[4]) if row[4] else 0,
            }
            for row in rows
        ]
