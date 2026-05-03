from .admin import router as admin_router
from .users import router as users_router

from fastapi import APIRouter

router = APIRouter()
router.include_router(users_router)
router.include_router(admin_router)

__all__ = ["router"]
