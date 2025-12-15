"""
Script to calculate distance matrix from store layout.
Run this once when store layout or category locations change.
"""

import json
import asyncio
import sys
import os

# Add parent directory to path to import from models and services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models import Category
from services.pathfinding import calculate_distance_matrix
from dotenv import load_dotenv


async def calculate_and_save_distances():
    """Calculate distance matrix from store grid and database categories, save to distance_matrix.json"""

    # Load environment and connect to MongoDB
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")

    client = AsyncIOMotorClient(DATABASE_URL, uuidRepresentation="standard")
    db = client["main"]

    # Initialize Beanie with Category model
    await init_beanie(database=db, document_models=[Category])
    print("Connected to MongoDB\n")

    # Load store layout (grid and entrance only)
    store_layout_path = os.path.join(os.path.dirname(__file__), "..", "store_layout.json")
    with open(store_layout_path, "r") as f:
        layout = json.load(f)

    print("Loaded store layout")
    print(f"Grid size: {len(layout['grid'][0])}x{len(layout['grid'])}")

    # Build locations dict from entrance
    locations = {"E": (layout["entrance"]["x"], layout["entrance"]["y"])}

    # Fetch categories from database
    categories = await Category.find_all().to_list()

    if not categories:
        print("❌ No categories found in database!")
        print("   Run sync_categories_to_db.py first to populate categories")
        client.close()
        return

    print(f"\nFetched {len(categories)} categories from database")

    # Add category locations from database
    for category in categories:
        locations[category.name] = (category.location.x, category.location.y)

    print(f"Locations to process: {list(locations.keys())}")

    # Calculate distance matrix
    distance_matrix = calculate_distance_matrix(layout["grid"], locations)

    # Convert tuple keys to string keys for JSON serialization
    distance_matrix_json = {}
    for (from_loc, to_loc), distance in distance_matrix.items():
        key = f"{from_loc}->{to_loc}"
        distance_matrix_json[key] = distance

    # Save to file
    distance_matrix_path = os.path.join(os.path.dirname(__file__), "..", "distance_matrix.json")
    with open(distance_matrix_path, "w") as f:
        json.dump(distance_matrix_json, f, indent=2)

    print(f"\n[SUCCESS] Distance matrix saved to distance_matrix.json")
    print(f"  Total pairs calculated: {len(distance_matrix_json)}")

    # Close MongoDB connection
    client.close()


if __name__ == "__main__":
    asyncio.run(calculate_and_save_distances())
