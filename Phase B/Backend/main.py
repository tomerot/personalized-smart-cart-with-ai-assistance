# load env first
from dotenv import load_dotenv

load_dotenv()

# other imports
import os
from contextlib import asynccontextmanager
from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import (
    CartSession,
    OTP,
    Product,
    ProductPurchaseTracking,
    ShoppingList,
    User,
    Category,
)
from routers import register_routers
from database import db, client
from clients import init_gemini_client, init_twilio_client


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
            ProductPurchaseTracking,
            ShoppingList,
            User,
            Category,
        ],
    )
    print("[SUCCESS] Beanie initialized with all models")

    # Initialize Gemini client
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        init_gemini_client(gemini_key)
    else:
        print("[WARNING] GEMINI_API_KEY not found in environment variables")

    # Initialize Twilio client
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
    if twilio_sid and twilio_token and twilio_phone:
        init_twilio_client(twilio_sid, twilio_token, twilio_phone)
    else:
        print("[WARNING] Twilio credentials not found in environment variables")

    yield
    client.close()
    print("[SUCCESS] Database connection closed")


app = FastAPI(lifespan=lifespan)
register_routers(app)  # from the routers/init file

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://list-creation-eight.vercel.app",
        "https://api.vapi.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"Looking good Dawg"}
