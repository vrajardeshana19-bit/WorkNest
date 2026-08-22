from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import check_database_connection
from app.routers import attendance, auth, employees, holidays, setup
from app.schemas.health import DatabaseHealthResponse, HealthResponse

settings = get_settings()

app = FastAPI(
    title="Dayflow API",
    description="HRMS backend — authentication, employees, attendance, holidays",
    version="0.5.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(setup.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(holidays.router, prefix="/api/v1")


@app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        environment=settings.app_env,
    )


@app.get(
    "/api/v1/health/db",
    response_model=DatabaseHealthResponse,
    tags=["health"],
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Database unavailable",
            "content": {
                "application/json": {
                    "example": {"status": "error", "database": "unavailable"},
                }
            },
        }
    },
)
def database_health_check():
    try:
        check_database_connection()
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "unavailable"},
        )

    return DatabaseHealthResponse(status="ok", database="connected")
