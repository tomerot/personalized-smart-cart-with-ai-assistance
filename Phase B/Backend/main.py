from contextlib import asynccontextmanager
from http import client
from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db, client
from models import CartSession, OTP, Product, Purchase_history, ShoppingList, User


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await client.admin.command("ping")
        print("✅ Connected to MongoDB successfully!")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
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
        ],
    )
    print("✅ Beanie initialized with all models")
    yield
    client.close()
    print("✅ Database connection closed")


app = FastAPI(lifespan=lifespan)
# HERE INCLUDE ALL THE ROUTERS we'll create
# app.include_router(The router name here)

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
