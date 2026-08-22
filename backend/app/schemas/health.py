from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str


class DatabaseHealthResponse(BaseModel):
    status: str
    database: str
