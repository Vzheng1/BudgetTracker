from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.session import engine, Base
from app.models import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="Budget Tracker API", lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok"}