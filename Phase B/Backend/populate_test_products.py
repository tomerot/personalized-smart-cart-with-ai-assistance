"""
Populate database with realistic Israeli product test data.
Run this script to add ~20 test products with variety for testing all features.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models import Product
from dotenv import load_dotenv


# Test products with variety for testing features
TEST_PRODUCTS = [
    # MILK CATEGORY - Test allergen conflicts
    {
        "barcode": "7290000065717",
        "name": "Tnuva Fresh Milk 3%",
        "company": "Tnuva",
        "category": "Milk",
        "price": 6.90,
        "size": "1L",
        "ingredients": ["Fresh milk", "Vitamin D"],
        "allergens": ["dairy"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
            "calories_per_100g": 64,
            "fat_per_100g": 3.0,
            "sodium_per_100mg": 50,
            "carbs_per_100g": 4.8,
            "sugar_per_100g": 4.8,
            "protein_per_100g": 3.2,
        },
    },
    {
        "barcode": "7290000066318",
        "name": "Tnuva Lactose Free Milk 1%",
        "company": "Tnuva",
        "category": "Milk",
        "price": 8.50,
        "size": "1L",
        "ingredients": ["Fresh milk", "Lactase enzyme", "Vitamin D"],
        "allergens": ["dairy"],
        "dietary_tags": ["kosher", "vegetarian", "lactose-free"],
        "nutritional_info": {
            "calories_per_100g": 42,
            "fat_per_100g": 1.0,
            "sodium_per_100mg": 50,
            "carbs_per_100g": 5.0,
            "sugar_per_100g": 5.0,
            "protein_per_100g": 3.4,
        },
    },
    {
        "barcode": "7290016770087",
        "name": "Alpro Soy Milk Unsweetened",
        "company": "Alpro",
        "category": "Milk",
        "price": 11.90,
        "size": "1L",
        "ingredients": ["Water", "Soybeans (8%)", "Calcium carbonate", "Sea salt"],
        "allergens": ["soy"],
        "dietary_tags": ["vegan", "dairy-free", "kosher"],
        "nutritional_info": {
            "calories_per_100g": 33,
            "fat_per_100g": 1.8,
            "sodium_per_100mg": 60,
            "carbs_per_100g": 0.5,
            "sugar_per_100g": 0,
            "protein_per_100g": 3.0,
        },
    },
    # YOGURTS - Test alternatives with different sugar levels
    {
        "barcode": "7290000068749",
        "name": "Yoplait Strawberry Yogurt",
        "company": "Yoplait",
        "category": "Yogurts",
        "price": 4.50,
        "size": "150g",
        "ingredients": ["Milk", "Strawberries (8%)", "Sugar", "Pectin", "Natural flavor"],
        "allergens": ["dairy"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
            "calories_per_100g": 90,
            "fat_per_100g": 2.5,
            "sodium_per_100mg": 50,
            "carbs_per_100g": 14.0,
            "sugar_per_100g": 12.0,
            "protein_per_100g": 3.5,
        },
    },
    {
        "barcode": "7290000069234",
        "name": "Danone Activia Light Yogurt",
        "company": "Danone",
        "category": "Yogurts",
        "price": 5.20,
        "size": "150g",
        "ingredients": ["Milk", "Sweetener (aspartame)", "Probiotics", "Natural flavor"],
        "allergens": ["dairy"],
        "dietary_tags": ["kosher", "vegetarian", "low-sugar"],
        "nutritional_info": {
            "calories_per_100g": 45,
            "fat_per_100g": 0.1,
            "sodium_per_100mg": 55,
            "carbs_per_100g": 6.0,
            "sugar_per_100g": 3.5,
            "protein_per_100g": 4.5,
        },
    },
    # CHOCOLATE - Test AI alternatives (different sugar/healthiness)
    {
        "barcode": "7290000071701",
        "name": "Elite Milk Chocolate Bar",
        "company": "Elite",
        "category": "Chocolate",
        "price": 7.90,
        "size": "100g",
        "ingredients": ["Sugar", "Cocoa butter", "Milk powder", "Cocoa mass", "Soy lecithin"],
        "allergens": ["dairy", "soy"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
            "calories_per_100g": 530,
            "fat_per_100g": 30.0,
            "sodium_per_100mg": 80,
            "carbs_per_100g": 57.0,
            "sugar_per_100g": 55.0,
            "protein_per_100g": 7.0,
        },
    },
    {
        "barcode": "7290000072234",
        "name": "Elite Dark Chocolate 70%",
        "company": "Elite",
        "category": "Chocolate",
        "price": 9.90,
        "size": "100g",
        "ingredients": ["Cocoa mass", "Sugar", "Cocoa butter", "Soy lecithin"],
        "allergens": ["soy"],
        "dietary_tags": ["kosher", "vegan", "dairy-free"],
        "nutritional_info": {
            "calories_per_100g": 510,
            "fat_per_100g": 35.0,
            "sodium_per_100mg": 10,
            "carbs_per_100g": 42.0,
            "sugar_per_100g": 28.0,
            "protein_per_100g": 8.0,
        },
    },
    {
        "barcode": "7290000072555",
        "name": "Elite Sugar Free Chocolate",
        "company": "Elite",
        "category": "Chocolate",
        "price": 11.90,
        "size": "85g",
        "ingredients": ["Cocoa mass", "Sweetener (maltitol)", "Cocoa butter", "Milk powder"],
        "allergens": ["dairy", "soy"],
        "dietary_tags": ["kosher", "vegetarian", "sugar-free"],
        "nutritional_info": {
            "calories_per_100g": 480,
            "fat_per_100g": 32.0,
            "sodium_per_100mg": 75,
            "carbs_per_100g": 48.0,
            "sugar_per_100g": 0.5,
            "protein_per_100g": 6.5,
        },
    },
    # SNACKS - Test variety and allergens
    {
        "barcode": "7290000073101",
        "name": "Bamba Peanut Snack",
        "company": "Osem",
        "category": "Snacks",
        "price": 5.50,
        "size": "80g",
        "ingredients": ["Peanuts (50%)", "Corn", "Palm oil", "Salt"],
        "allergens": ["peanuts"],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
            "calories_per_100g": 540,
            "fat_per_100g": 30.0,
            "sodium_per_100mg": 380,
            "carbs_per_100g": 54.0,
            "sugar_per_100g": 3.0,
            "protein_per_100g": 12.0,
        },
    },
    {
        "barcode": "7290000073804",
        "name": "Bissli BBQ Flavor",
        "company": "Osem",
        "category": "Snacks",
        "price": 4.90,
        "size": "70g",
        "ingredients": ["Wheat flour", "Sunflower oil", "BBQ seasoning", "Salt", "Sugar"],
        "allergens": ["gluten"],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
            "calories_per_100g": 480,
            "fat_per_100g": 21.0,
            "sodium_per_100mg": 820,
            "carbs_per_100g": 62.0,
            "sugar_per_100g": 8.0,
            "protein_per_100g": 9.0,
        },
    },
    # PASTA - Test gluten-free alternatives
    {
        "barcode": "7290000074320",
        "name": "Osem Pasta Spirals",
        "company": "Osem",
        "category": "Pasta",
        "price": 6.50,
        "size": "500g",
        "ingredients": ["Durum wheat semolina", "Water"],
        "allergens": ["gluten"],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
            "calories_per_100g": 350,
            "fat_per_100g": 1.5,
            "sodium_per_100mg": 5,
            "carbs_per_100g": 71.0,
            "sugar_per_100g": 3.0,
            "protein_per_100g": 12.0,
        },
    },
    {
        "barcode": "7290000074801",
        "name": "Barilla Gluten Free Penne",
        "company": "Barilla",
        "category": "Pasta",
        "price": 13.90,
        "size": "400g",
        "ingredients": ["Corn flour", "Rice flour", "Water"],
        "allergens": [],
        "dietary_tags": ["kosher", "vegan", "gluten-free"],
        "nutritional_info": {
            "calories_per_100g": 340,
            "fat_per_100g": 1.8,
            "sodium_per_100mg": 0,
            "carbs_per_100g": 76.0,
            "sugar_per_100g": 1.2,
            "protein_per_100g": 6.5,
        },
    },
    # CEREAL - Test breakfast alternatives
    {
        "barcode": "7290000075204",
        "name": "Telma Cornflakes",
        "company": "Telma",
        "category": "Cereal",
        "price": 12.90,
        "size": "500g",
        "ingredients": ["Corn", "Sugar", "Salt", "Malt extract", "Vitamins"],
        "allergens": ["gluten"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
            "calories_per_100g": 370,
            "fat_per_100g": 0.8,
            "sodium_per_100mg": 650,
            "carbs_per_100g": 84.0,
            "sugar_per_100g": 8.0,
            "protein_per_100g": 7.0,
        },
    },
    {
        "barcode": "7290000075600",
        "name": "Quaker Oats",
        "company": "Quaker",
        "category": "Cereal",
        "price": 15.50,
        "size": "500g",
        "ingredients": ["100% Whole grain oats"],
        "allergens": ["gluten"],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
            "calories_per_100g": 375,
            "fat_per_100g": 7.0,
            "sodium_per_100mg": 2,
            "carbs_per_100g": 66.0,
            "sugar_per_100g": 1.0,
            "protein_per_100g": 13.0,
        },
    },
    # NUTS - Test allergen conflicts
    {
        "barcode": "7290000076102",
        "name": "Elite Roasted Almonds",
        "company": "Elite",
        "category": "Nuts",
        "price": 19.90,
        "size": "200g",
        "ingredients": ["Almonds", "Salt"],
        "allergens": ["tree nuts"],
        "dietary_tags": ["kosher", "vegan", "gluten-free"],
        "nutritional_info": {
            "calories_per_100g": 600,
            "fat_per_100g": 50.0,
            "sodium_per_100mg": 200,
            "carbs_per_100g": 20.0,
            "sugar_per_100g": 4.0,
            "protein_per_100g": 21.0,
        },
    },
    # COFFEE - Different types
    {
        "barcode": "7290000076805",
        "name": "Elite Instant Coffee",
        "company": "Elite",
        "category": "Coffee",
        "price": 24.90,
        "size": "200g",
        "ingredients": ["100% Coffee"],
        "allergens": [],
        "dietary_tags": ["kosher", "vegan", "gluten-free"],
        "nutritional_info": {
            "calories_per_100g": 2,
            "fat_per_100g": 0,
            "sodium_per_100mg": 5,
            "carbs_per_100g": 0,
            "sugar_per_100g": 0,
            "protein_per_100g": 0.2,
        },
    },
    # ICE CREAM - Test dairy alternatives
    {
        "barcode": "7290000077321",
        "name": "Strauss Vanilla Ice Cream",
        "company": "Strauss",
        "category": "Ice Cream",
        "price": 16.90,
        "size": "500ml",
        "ingredients": ["Milk", "Cream", "Sugar", "Egg yolk", "Natural vanilla"],
        "allergens": ["dairy", "eggs"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
            "calories_per_100g": 210,
            "fat_per_100g": 11.0,
            "sodium_per_100mg": 70,
            "carbs_per_100g": 24.0,
            "sugar_per_100g": 22.0,
            "protein_per_100g": 3.5,
        },
    },
    {
        "barcode": "7290000077604",
        "name": "Ben & Jerry's Chocolate Fudge",
        "company": "Ben & Jerry's",
        "category": "Ice Cream",
        "price": 28.90,
        "size": "465ml",
        "ingredients": ["Milk", "Cream", "Sugar", "Cocoa powder", "Chocolate chunks", "Egg yolk"],
        "allergens": ["dairy", "eggs", "soy"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
            "calories_per_100g": 260,
            "fat_per_100g": 14.0,
            "sodium_per_100mg": 85,
            "carbs_per_100g": 30.0,
            "sugar_per_100g": 27.0,
            "protein_per_100g": 4.0,
        },
    },
    # SOFT DRINKS
    {
        "barcode": "7290000078120",
        "name": "Coca Cola",
        "company": "Coca Cola",
        "category": "Soft Drinks",
        "price": 8.90,
        "size": "1.5L",
        "ingredients": ["Carbonated water", "Sugar", "Caramel color", "Phosphoric acid", "Natural flavors", "Caffeine"],
        "allergens": [],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
            "calories_per_100g": 42,
            "fat_per_100g": 0,
            "sodium_per_100mg": 10,
            "carbs_per_100g": 10.6,
            "sugar_per_100g": 10.6,
            "protein_per_100g": 0,
        },
    },
    {
        "barcode": "7290000078502",
        "name": "Coca Cola Zero",
        "company": "Coca Cola",
        "category": "Soft Drinks",
        "price": 8.90,
        "size": "1.5L",
        "ingredients": ["Carbonated water", "Caramel color", "Sweeteners (aspartame, acesulfame K)", "Phosphoric acid", "Natural flavors", "Caffeine"],
        "allergens": [],
        "dietary_tags": ["kosher", "vegan", "sugar-free"],
        "nutritional_info": {
            "calories_per_100g": 0.3,
            "fat_per_100g": 0,
            "sodium_per_100mg": 15,
            "carbs_per_100g": 0,
            "sugar_per_100g": 0,
            "protein_per_100g": 0,
        },
    },
]


async def populate_products():
    """Populate database with test products"""

    # Load environment and connect to MongoDB
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")

    client = AsyncIOMotorClient(DATABASE_URL, uuidRepresentation="standard")
    db = client["main"]

    # Initialize Beanie with Product model
    await init_beanie(database=db, document_models=[Product])
    print("✓ Connected to MongoDB\n")

    # Optional: Clear existing products
    print("Clearing existing products...")
    await Product.delete_all()
    print("✓ Existing products cleared\n")

    # Insert test products
    print(f"Inserting {len(TEST_PRODUCTS)} test products...\n")
    inserted_count = 0

    for product_data in TEST_PRODUCTS:
        try:
            product = Product(**product_data)
            await product.insert()
            print(f"✓ Added: {product.name} ({product.category}) - ₪{product.price}")
            inserted_count += 1
        except Exception as e:
            print(f"✗ Failed to add {product_data['name']}: {e}")

    print(f"\n{'='*60}")
    print(f"✓ Successfully inserted {inserted_count}/{len(TEST_PRODUCTS)} products")
    print(f"{'='*60}\n")

    # Summary by category
    categories = {}
    for p in TEST_PRODUCTS:
        cat = p["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print("Products by category:")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count} products")

    print("\n✓ Database populated successfully!")

    # Close connection
    client.close()


if __name__ == "__main__":
    asyncio.run(populate_products())
