from fastapi import FastAPI
from .otp import router as otp_router
from .products import router as products_router
from .users import router as users_router
from .checkout import router as checkout_router
from .shopping_list import router as shopping_list_router
from .cart_session import router as cart_session_router
from .vapi_webhook import router as vapi_webhook_router

__all__ = ["register_routers"]


def register_routers(app: FastAPI):

    app.include_router(otp_router)
    app.include_router(products_router)
    app.include_router(users_router)
    app.include_router(checkout_router)
    app.include_router(shopping_list_router)
    app.include_router(cart_session_router)
    app.include_router(vapi_webhook_router)
    print("Routers registered successfully.")
