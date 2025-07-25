from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from .config import settings

# Async database setup with pgbouncer compatibility
from sqlalchemy.pool import NullPool

# Alternative connection string format for Supabase
DATABASE_URL = settings.database_url
if "supabase" in DATABASE_URL:
    # Supabase direct connection - skip pgbouncer
    DATABASE_URL = DATABASE_URL.replace(":6543/", ":5432/")

async_engine = create_async_engine(
    DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,  # Disable echo to reduce prepared statements
    pool_pre_ping=False,  # Disable pre-ping
    pool_recycle=-1,  # Disable pool recycle
    # Disable prepared statements completely for pgbouncer
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    },
    # Use NullPool to create new connections each time
    poolclass=NullPool,
    # Execution options to disable compiled cache
    execution_options={
        "compiled_cache": {},
        "isolation_level": "AUTOCOMMIT"
    }
)

AsyncSessionLocal = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# Sync database setup (for migrations)
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


async def get_async_db():
    """Dependency to get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db():
    """Dependency to get sync database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 