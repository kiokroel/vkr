from fastapi import FastAPI

from src.routes.categories import router as categories_router
from src.routes.operations import router as operations_router

app = FastAPI(title="backend")

app.include_router(categories_router)
app.include_router(operations_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict:
    return {"service": "backend"}
