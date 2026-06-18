from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, AsyncSessionLocal
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.services.main_email_service import sync_emails

# Set up router for EmailApi
router = APIRouter(prefix="/emails", tags=["emails"])

async def run_sync_with_new_session(user_id: str):
    """
    Runs email sync with its own database session.
    Background tasks can't reuse the request's session — it's already
    closed by the time the background task runs.
    """
    # Create a fresh session just for this background task
    async with AsyncSessionLocal() as db:
        # Fetch a fresh user object with the new session
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

        if not user:
            return

        stats = await sync_emails(user, db)
        print(f"Sync complete: {stats}")


@router.post("/sync")
async def trigger_sync(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    if not current_user.oauth_token:
        return {"message": "Gmail not connected"}

    # Pass only the user ID — the background task opens its own session
    background_tasks.add_task(run_sync_with_new_session, str(current_user.id))

    return {"message": "Sync started"}