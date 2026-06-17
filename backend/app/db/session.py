from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Create the database engine using the database URL from settings 
#   - This is the main connection to the database that will be used throughout the application
engine = create_async_engine(settings.database_url)

# Create a new sessionmaker for the database sessions
# - This will be used to create new database sessions for each request
# - expire_on_commit=False means that objects will not be expired after commit, so they can still be accessed without refreshing from the database
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base is the parent class for all database models
#   - So when we define a model class that inherits from Base, SQLAlchemy knows to create a table for it
class Base(DeclarativeBase):
    pass

# FastAPI dependency to get the database session
#  - It will open a database session, give it a route handler, then close it -> yield makes it a context manager so cleanup happens after the request
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session