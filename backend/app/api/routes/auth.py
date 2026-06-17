import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.models import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = " ".join([
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
])


@router.get("/google/url")
def get_google_url():
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return {"url": f"{GOOGLE_AUTH_URL}?{query}"}


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_res = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        })

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange token")

    tokens = token_res.json()

    # Get user info from Google
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )

    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    google_user = user_res.json()

    # Upsert user in database
    result = await db.execute(select(User).where(User.email == google_user["email"]))
    user = result.scalars().first()

    if not user:
        user = User(
            email=google_user["email"],
            name=google_user.get("name"),
            picture=google_user.get("picture"),
            google_id=google_user["id"],
            oauth_token=tokens,
        )
        db.add(user)
    else:
        user.oauth_token = tokens
        user.name = google_user.get("name")
        user.picture = google_user.get("picture")

    await db.commit()
    await db.refresh(user)

    # Issue JWT and redirect to frontend
    jwt_token = create_access_token(str(user.id))
    frontend_url = settings.frontend_url
    return {"access_token": jwt_token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "gmail_connected": current_user.gmail_connected,
    }