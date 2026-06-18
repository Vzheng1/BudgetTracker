from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
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
    category: Optional[str] = None,
    needs_review: Optional[bool] = None,
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

    # Apply optional filters if provided
    if category:
        query = query.where(Transaction.category == category)
    if needs_review is not None:
        query = query.where(Transaction.needs_review == needs_review)

    result = await db.execute(query)
    transactions = result.scalars().all()

    # Format each transaction as a dictionary for the JSON response
    return [_format_transaction(t) for t in transactions]


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