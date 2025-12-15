"""
Sync categories from store_reference.json to MongoDB.
Run this whenever you update category locations to keep MongoDB in sync.
"""

import json
import asyncio
import sys
import os

# Add parent directory to path to import from models
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models import Category
from dotenv import load_dotenv


async def sync_categories():
    """Sync categories from store_reference.json to MongoDB"""

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

    # Load store reference file (contains category mapping)
    store_reference_path = os.path.join(os.path.dirname(__file__), "store_reference.json")
    with open(store_reference_path, "r") as f:
        layout = json.load(f)

    category_mapping = layout.get("category_mapping", {})

    if not category_mapping:
        print("❌ No category_mapping found in store_reference.json!")
        return

    print(f"Found {len(category_mapping)} categories in store_reference.json\n")

    # Sync each category
    synced = 0
    updated = 0
    created = 0

    for category_name, cat_data in category_mapping.items():
        x = cat_data["x"]
        y = cat_data["y"]
        letter = cat_data.get("letter", "?")

        # Check if category exists in DB
        existing = await Category.find_one(Category.name == category_name)

        if existing:
            # Update if coordinates changed
            if existing.location.x != x or existing.location.y != y:
                existing.location.x = x
                existing.location.y = y
                await existing.save()
                print(f"[UPDATED] {category_name} (letter: {letter}) -> ({x}, {y})")
                updated += 1
            else:
                print(f"[OK] {category_name} (letter: {letter}) -> ({x}, {y})")
        else:
            # Create new category
            new_category = Category(name=category_name, location={"x": x, "y": y})
            await new_category.insert()
            print(f"[CREATED] {category_name} (letter: {letter}) -> ({x}, {y})")
            created += 1

        synced += 1

    print(f"\n[SUCCESS] Synced {synced} categories to MongoDB")
    print(f"  Created: {created}")
    print(f"  Updated: {updated}")
    print(f"  Unchanged: {synced - created - updated}")

    # Close MongoDB connection
    client.close()


if __name__ == "__main__":
    asyncio.run(sync_categories())
