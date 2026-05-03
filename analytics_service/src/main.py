import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.routes.analytics import router as analytics_router
from src.services.training import monthly_training_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(monthly_training_loop())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(
    title="analytics-service",
    lifespan=lifespan,
    docs_url="/analytics/docs",
    openapi_url="/analytics/openapi.json",
)

app.include_router(analytics_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict:
    return {"service": "analytics-service"}
