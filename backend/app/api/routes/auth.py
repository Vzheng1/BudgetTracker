import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.models import User
from app.api.deps import get_current_user
from app.api.routes.emails import run_sync_with_new_session

# Groups all related endpoints together -> all routes starting with /auth
router = APIRouter(prefix="/auth", tags=["auth"])

# Google OAuth2 Endpoint URLs
# (1) Users are SENT to auth_url to login
# (2) EXCHANGE code at token_url for tokens 
# (3) GET user info at userinfo_url
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# Scopes (Tells Google what permissions we need)
#   openid - basic id; required for OAuth
#   userinfo.email - email address
#   userinfo.profile - basic profile info like name and profile picture
#   gmail.readonly - read-only access to Gmail (for getting receipts from emails)
SCOPES = " ".join([
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
])


# Used to build the URL the user will be redirected to
#   client_id: ID of your application
#   redirect_uri: The URI to redirect to after login
#   response_type: The type of response desired (code -> we want auth code, not token)
#   scope: The scopes/permissions your application is requesting
#   access_type: The type of access requested (offline for refresh tokens)
#   prompt: The type of user interaction requested (consent)
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


# After user successfully logins in, Google redirects them here using the one time code in the URL - Must be excahnges immediately
@router.get("/google/callback")
async def google_callback(code: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # (1) Exchange the code for tokens by sending client_id and client_secret in a POST request to the Google token endpoint
    #   - Make sure the response is valid (200), else exception
    #   - Token response should include access_token (short-lived, call Google API NOW) and refresh_token (long-lived, use to get new access tokens)
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

    # (2) Get user profile from Google using the access_token using GET request
    #   - Make sure response is valid
    #   - Response should include the user's id, email, name, picture
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )

    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    google_user = user_res.json()

    # (3) Check if this user already exists in the database
    result = await db.execute(select(User).where(User.email == google_user["email"]))
    user = result.scalars().first()

    # (3a) If user does not exist -> First time log in -> Create a new user in database for them
    if not user:
        user = User(
            email=google_user["email"],
            name=google_user.get("name"),
            picture=google_user.get("picture"),
            google_id=google_user["id"],
            oauth_token=tokens,
            gmail_connected=True,
        )
        db.add(user)
    # (3b) If user exists -> Have logged in before -> Update their tokens and profile information
    else:
        user.oauth_token = tokens
        user.name = google_user.get("name")
        user.picture = google_user.get("picture")
        user.gmail_connected = True

    # (3c) Save these changes to the database
    await db.commit()
    await db.refresh(user)

    # (4) Create JWT token for the user (for our own app) + Redirect browser to frontend with the JWT in URL
    #   - This JWT token will be used to authenticate the user in our app so frontend will store it
    # Run email sync in background after login
    jwt_token = create_access_token(str(user.id))
    background_tasks.add_task(run_sync_with_new_session, str(user.id)) 
    return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?token={jwt_token}")


# Get the current user information
#   get_current_user reads JWT from request header and decodes it to get user_id to fetch user from databse
#   - if token is missing/invalid, it raises an 401 automatically
@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "gmail_connected": current_user.gmail_connected,
        "last_synced_at": current_user.last_synced_at.isoformat() if current_user.last_synced_at else None,
    }