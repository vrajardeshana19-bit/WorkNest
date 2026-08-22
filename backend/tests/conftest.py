import os
from collections.abc import Generator

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

if not os.getenv("JWT_SECRET"):
    os.environ["JWT_SECRET"] = "pytest-jwt-secret"
if not os.getenv("DATABASE_URL") and not os.getenv("TEST_DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@localhost:5432/dayflow_test"


from app.database import get_db
from app.main import app
from app.models import Base


def get_test_database_url() -> str:
    url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not url:
        pytest.skip("Set TEST_DATABASE_URL or DATABASE_URL to run database tests.")
    if not url.startswith("postgresql"):
        pytest.skip("Database tests require PostgreSQL (Neon). SQLite is not supported.")
    return url


@pytest.fixture(scope="session")
def engine() -> Generator[Engine, None, None]:
    url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
    test_engine = None
    if url and url.startswith("postgresql") and "localhost:5432" not in url:
        try:
            test_engine = create_engine(url, pool_pre_ping=True)
            with test_engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except Exception:
            test_engine = None

    if test_engine is None:
        from sqlalchemy.pool import StaticPool
        test_engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    test_engine.dispose()



@pytest.fixture
def db_session(engine: Engine) -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
