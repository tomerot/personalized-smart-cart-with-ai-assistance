# load env first
from dotenv import load_dotenv

load_dotenv()

# other imports
from contextlib import asynccontextmanager
from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import (
    CartSession,
    OTP,
    Product,
    Purchase_history,
    ShoppingList,
    User,
    Category,
)
from routers import register_routers
from database import db, client


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await client.admin.command("ping")
        print("[SUCCESS] Connected to MongoDB successfully!")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        raise

    await init_beanie(
        database=db,
        document_models=[
            CartSession,
            OTP,
            Product,
            Purchase_history,
            ShoppingList,
            User,
            Category,
        ],
    )
    print("[SUCCESS] Beanie initialized with all models")
    yield
    client.close()
    print("[SUCCESS] Database connection closed")


app = FastAPI(lifespan=lifespan)
register_routers(app)  # from the routers/init file

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "ADD THE FRONT DOMAIN",
        "https://api.vapi.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"Looking good Dawg"}
