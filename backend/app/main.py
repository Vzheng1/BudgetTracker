from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.models import models
from app.core.config import settings
from app.api.routes import auth, transactions, budgets

# Function that runs on startup and shutdown - Everything before "yield" runs at startup and after runs at shutdown
#   - asynccontextmanager makes it work with FastAPI's lifespan system
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

# Create the FastAPI application that connects to our startup/shutdown function
app = FastAPI(title="Budget Tracker API", lifespan=lifespan)

# Add CORS middleware to allow requests from the frontend
#   - This is important for security and to allow our frontend to communicate with the backend without getting blocked
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers so all routes are available under /api/v1/auth/
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(transactions.router, prefix=settings.api_prefix)
app.include_router(budgets.router, prefix=settings.api_prefix)

# Health check endpoint - Used by Railway/Docker to verify the app is running
@app.get("/health")
def health():
    return {"status": "ok"}