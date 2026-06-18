from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Transaction, Correction

# Set up router for transactions API
router = APIRouter(prefix="/transactions", tags=["transactions"])

# Pydantic model for creating a transaction manually
#   - FastAPI uses this to validate the request body
class TransactionCreate(BaseModel):
    merchant: str
    amount: float
    currency: str = "USD"
    date: str
    category: str = "Other"
    description: Optional[str] = None


# Pydantic model for correcting a transaction's category
class CategoryCorrection(BaseModel):
    category: str

# GET a list of all transactions
@router.get("")
async def list_transactions(
    search: Optional[str] = Query(None),
    category: Optional[str] = None,
    needs_review: Optional[bool] = None,
    period: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sort_by: str = Query("date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(25),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Build query to get transactions - Filtering by logged in user and not deleted
    #   - Lists from newest to oldest
    #   - Ensures users can never see each other's transactions
    query = (
        select(Transaction)
        .where(
            Transaction.user_id == current_user.id,
            # Soft delete filter — exclude transactions marked as deleted
            Transaction.deleted_at == None
        )
        .order_by(Transaction.date.desc())  
    )

    # Search should match either merchant or description
    if search:
        query = query.where(
            or_(
                Transaction.merchant.ilike(f"%{search}%"),
                Transaction.description.ilike(f"%{search}%"),
            )
        )

    # Apply optional filters if provided
    if category:
        query = query.where(Transaction.category == category)
    if needs_review is not None:
        query = query.where(Transaction.needs_review == needs_review)

    # Time period filter
    if period:
        now = datetime.now(timezone.utc)
        period_map = {
            "7d":   now - timedelta(days=7),
            "30d":  now - timedelta(days=30),
            "90d":  now - timedelta(days=90),
            "180d": now - timedelta(days=180),
            "1y":   now - timedelta(days=365),
        }
        if period in period_map:
            query = query.where(Transaction.date >= period_map[period])
    
    # Custom date range
    if date_from:
        try:
            query = query.where(
                Transaction.date >= datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
            )
        except ValueError:
            pass
    if date_to:
        try:
            query = query.where(
                Transaction.date <= datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
            )
        except ValueError:
            pass

    # Get total count before pagination (for frontend to know total pages)
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total_count = count_result.scalar() or 0

    # Sorting
    sort_col_map = {
        "date":     Transaction.date,
        "merchant": Transaction.merchant,
        "amount":   Transaction.amount,
        "category": Transaction.category,
    }
    sort_col = sort_col_map.get(sort_by, Transaction.date)
    if sort_dir == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Pagination
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    transactions = result.scalars().all()

    # Format each transaction as a dictionary for the JSON response
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "transactions": [_format_transaction(t) for t in transactions],
    }


# Create a new transaction in the backend
@router.post("")
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Parse the date string into a datetime object
    try:
        date = datetime.fromisoformat(data.date).replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Create the transaction and add to the database + update user balance
    transaction = Transaction(
        user_id=current_user.id,
        merchant=data.merchant,
        amount=data.amount,
        currency=data.currency,
        date=date,
        category=data.category,
        description=data.description,
        needs_review=False,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    return _format_transaction(transaction)


# Delete a transaction
@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the transaction and make sure it belongs to the current user
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        )
    )
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Soft delete -> Set deleted_at instead of removing the row
    #   - Preserves financial history and allows future undo functionality
    transaction.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Transaction deleted"}


# Correct a transaction's category
@router.post("/{transaction_id}/correct")
async def correct_category(
    transaction_id: str,
    data: CategoryCorrection,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the transaction
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        )
    )
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Store the correction in its own table for ML training data
    correction = Correction(
        transaction_id=transaction.id,
        user_id=current_user.id,
        original_category=transaction.category,  
        corrected_category=data.category,          
        merchant=transaction.merchant,             
    )
    db.add(correction)

    # Update the transaction itself
    transaction.category = data.category
    transaction.needs_review = False 

    await db.commit()

    return {"message": "Category updated", "category": data.category}


# Helper function to convert a Transaction model to a JSON-serializable dict
def _format_transaction(t: Transaction) -> dict:
    return {
        "id": str(t.id),
        "merchant": t.merchant,
        "amount": float(t.amount),   
        "currency": t.currency,
        "date": t.date.isoformat() if t.date else None,
        "category": t.category,
        "description": t.description,
        "needs_review": t.needs_review,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }