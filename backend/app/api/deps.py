from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.models import User

# HTTPBearer is a FastAPI dependency that extracts the Authorization header from the request
#   - Automatically returns 403 if the header is missing
bearer = HTTPBearer()


# Dependency to get the current user from the request
async def get_current_user(
    # (1) Extract the token from the request header then open a database session for this request
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    # (2) Get the raw token string from the Auth header + decode and verify the JWT
    #   - Will either return user_id or None if invalid
    #   - If it is invalid, return an exception
    token = credentials.credentials
    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # (3) Query the database for the user using the user_id from the token
    #   - If the user is not found, return an exception
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Return the user objects so route handlers can deal with it as necessary
    return user