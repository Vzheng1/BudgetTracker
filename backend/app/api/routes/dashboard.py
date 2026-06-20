from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, literal
from datetime import datetime, timezone, timedelta
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Transaction, Budget, Insight


# Set up router for DashboardApi 
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# GET all necessary data/information for the dashboard
@router.get("")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get the current date and start/end of month - Insights are given monthly 
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # ── Total spent this month ────────────────────────────────────────────────
    result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == current_user.id,
            Transaction.date >= month_start,
            Transaction.deleted_at == None,
        )
    )
    total_this_month = float(result.scalar() or 0)

    # ── Total spent last month ────────────────────────────────────────────────
    result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == current_user.id,
            Transaction.date >= last_month_start,
            Transaction.date < month_start,
            Transaction.deleted_at == None,
        )
    )
    total_last_month = float(result.scalar() or 0)

    # ── Transaction count this month ──────────────────────────────────────────
    result = await db.execute(
        select(func.count()).where(
            Transaction.user_id == current_user.id,
            Transaction.date >= month_start,
            Transaction.deleted_at == None,
        )
    )
    transaction_count = int(result.scalar() or 0)

    # ── Spending by category this month ───────────────────────────────────────
    result = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount).label("total"))
        .where(
            Transaction.user_id == current_user.id,
            Transaction.date >= month_start,
            Transaction.deleted_at == None,
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    )
    by_category = [
        {"category": row.category, "total": float(row.total)}
        for row in result.all()
    ]

    # ── Top category this month ───────────────────────────────────────────────
    top_category = by_category[0]["category"] if by_category else None

    # ── Recent transactions ───────────────────────────────────────────────────
    result = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.deleted_at == None,
        )
        .order_by(Transaction.date.desc())
        .limit(5)
    )
    recent = result.scalars().all()
    recent_transactions = [
        {
            "id": str(t.id),
            "merchant": t.merchant,
            "amount": float(t.amount),
            "category": t.category,
            "date": t.date.isoformat(),
        }
        for t in recent
    ]

    # ── Budgets with utilization ──────────────────────────────────────────────
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id)
    )
    budgets = result.scalars().all()

    budget_data = []
    for budget in budgets:
        # How much spent in this budget's category this month
        spent_result = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == current_user.id,
                Transaction.category == budget.category,
                Transaction.date >= month_start,
                Transaction.deleted_at == None,
            )
        )
        spent = float(spent_result.scalar() or 0)
        limit = float(budget.limit_amount)
        budget_data.append({
            "id": str(budget.id),
            "category": budget.category,
            "limit_amount": limit,
            "spent": round(spent, 2),
            "remaining": round(limit - spent, 2),
            "utilization_pct": round((spent / limit * 100) if limit > 0 else 0, 1),
        })

    # ── AI insights ───────────────────────────────────────────────────────────
    result = await db.execute(
        select(Insight)
        .where(Insight.user_id == current_user.id)
        .order_by(Insight.created_at.desc())
        .limit(5)
    )
    insights = [
        {"message": i.message, "insight_type": i.insight_type}
        for i in result.scalars().all()
    ]

    # ── Month over month change ───────────────────────────────────────────────
    # Positive = spending more, negative = spending less
    mom_change = total_this_month - total_last_month
    mom_pct = (
        round((mom_change / total_last_month) * 100, 1)
        if total_last_month > 0 else 0
    )

    # ── Monthly trend (last 12 months) ───────────────────────────────────────────
    ym = func.to_char(Transaction.date, literal('YYYY-MM'))
    trend_result = await db.execute(
        select(ym.label("month"), func.sum(Transaction.amount).label("total"))
        .where(
            Transaction.user_id == current_user.id,
            Transaction.date >= now - timedelta(days=365),
            Transaction.deleted_at == None,
        )
        .group_by(ym)
        .order_by(ym)
    )
    monthly_trend = [
        {"month": row.month, "total": float(row.total)}
        for row in trend_result.all()
    ]

    # ── Yearly trend (all years, 5 most recent) ───────────────────────────────
    yr = func.to_char(Transaction.date, literal('YYYY'))
    yearly_result = await db.execute(
        select(yr.label("year"), func.sum(Transaction.amount).label("total"))
        .where(
            Transaction.user_id == current_user.id,
            Transaction.deleted_at == None,
        )
        .group_by(yr)
        .order_by(yr.desc())
        .limit(5)
    )
    yearly_trend = [
        {"month": row.year, "total": float(row.total)}
        for row in reversed(yearly_result.all())
    ]

    return {
        "total_this_month": round(total_this_month, 2),
        "total_last_month": round(total_last_month, 2),
        "mom_change": round(mom_change, 2),
        "mom_pct": mom_pct,
        "transaction_count": transaction_count,
        "top_category": top_category,
        "by_category": by_category,
        "recent_transactions": recent_transactions,
        "budgets": budget_data,
        "insights": insights,
        "monthly_trend": monthly_trend,
        "yearly_trend": yearly_trend,
    }