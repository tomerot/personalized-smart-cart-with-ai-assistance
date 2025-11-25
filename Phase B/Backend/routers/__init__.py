from fastapi import FastAPI
from .otp import router as otp_router
from .products import router as products_router
from .users import router as users_router
from .purchase_tracking import router as purchase_tracking_router
from .shopping_list import router as shopping_list_router
from .cart_session import router as cart_session_router
from .store import router as store_router

__all__ = ["register_routers"]


def register_routers(app: FastAPI):

    app.include_router(otp_router)
    app.include_router(products_router)
    app.include_router(users_router)
    app.include_router(purchase_tracking_router)
    app.include_router(shopping_list_router)
    app.include_router(cart_session_router)
    app.include_router(store_router)
    print("Routers registered successfully.")
