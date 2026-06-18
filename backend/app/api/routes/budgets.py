from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from pydantic import BaseModel
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Budget, Transaction


# Set up router for BudgetsApi
router = APIRouter(prefix="/budgets", tags=["budgets"])

# Pydantic model for creating a budget
class BudgetCreate(BaseModel):
    category: str
    limit_amount: float
    period: str = "monthly"


# GET a list of budgets from database
@router.get("")
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch all budgets for the current logged in user
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id)
    )
    budgets = result.scalars().all()

    # Update each budget with how much has been spent this month
    return [await _enrich_budget(budget, db) for budget in budgets]


# Create a new budget and POST into database
@router.post("")
async def create_budget(
    data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if a budget already exists for this category -> one budget per category only
    result = await db.execute(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category == data.category,
        )
    )
    existing = result.scalars().first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Budget for {data.category} already exists"
        )

    budget = Budget(
        user_id=current_user.id,
        category=data.category,
        limit_amount=data.limit_amount,
        period=data.period,
    )
    db.add(budget)
    await db.commit()
    await db.refresh(budget)

    return await _enrich_budget(budget, db)


# Update an existing budget and POST update into database
@router.put("/{budget_id}")
async def update_budget(
    budget_id: str,
    data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the target budget + make sure it belongs to the current user
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
    )
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Update the limit amount
    budget.limit_amount = data.limit_amount
    await db.commit()
    await db.refresh(budget)

    return await _enrich_budget(budget, db)


# DELETE a budget for a user
@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the target budget + make sure it belongs to the current user
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
    )
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Delete that budget and update database
    await db.delete(budget)
    await db.commit()

    return {"message": "Budget deleted"}


# Helper method to enrich budget data
async def _enrich_budget(budget: Budget, db: AsyncSession) -> dict:
    # Calculate how much the user has spent in this category this month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Sum all transactions in this category since the start of the month
    result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == budget.user_id,
            Transaction.category == budget.category,
            Transaction.date >= month_start,
            Transaction.deleted_at == None, 
        )
    )
    # If no transactions exist yet, default to 0
    spent = float(result.scalar() or 0)
    limit = float(budget.limit_amount)

    return {
        "id": str(budget.id),
        "category": budget.category,
        "limit_amount": limit,
        "period": budget.period,
        "spent": round(spent, 2),
        "remaining": round(limit - spent, 2),
        "utilization_pct": round((spent / limit * 100) if limit > 0 else 0, 1),
    }