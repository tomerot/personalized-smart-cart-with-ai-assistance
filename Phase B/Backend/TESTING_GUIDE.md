# 🧪 COMPREHENSIVE TESTING GUIDE - PRE-PRODUCTION
**Last Updated:** Before Production Deploy
**Purpose:** Systematically test ALL endpoints and features before going live

---

## 📋 Table of Contents
1. [Setup & Prerequisites](#setup--prerequisites)
2. [Authentication Flow (OTP)](#1-authentication-flow-otp)
3. [User Profile Management](#2-user-profile-management)
4. [Product Discovery & Details](#3-product-discovery--details)
5. [Product Scanning & Conflict Detection](#4-product-scanning--conflict-detection)
6. [AI-Powered Alternatives](#5-ai-powered-alternatives)
7. [Cart Session Management](#6-cart-session-management)
8. [Shopping List & Route Optimization](#7-shopping-list--route-optimization)
9. [Purchase Tracking & Checkout](#8-purchase-tracking--checkout)
10. [Replenishment Suggestions](#9-replenishment-suggestions)
11. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
12. [Integration Test - Full User Journey](#11-integration-test---full-user-journey)

---

## Setup & Prerequisites

### 1. Start the Server
```bash
# Activate virtual environment
venv\Scripts\activate

# Start FastAPI server
uvicorn main:app --reload
```

**Expected Output:**
```
[SUCCESS] Connected to MongoDB successfully!
[SUCCESS] Beanie initialized with all models
✓ Gemini client initialized
✓ Twilio client initialized
```

### 2. Populate Test Data
```bash
python populate_test_products.py
```

**Expected Output:**
```
✓ Successfully inserted 20/20 products
```

### 3. Verify Server is Running
```bash
curl http://localhost:8000/
```

**Expected Response:**
```json
{"Looking good Dawg"}
```

### 4. Check API Documentation
Open browser: `http://localhost:8000/docs`

### Test Users to Use:
- **User 1 (No restrictions):** `+972501234567`
- **User 2 (Allergies):** `+972507654321` - Will add peanuts, dairy allergies
- **User 3 (Vegan):** `+972509876543` - Will add vegan dietary need

---

## 1. Authentication Flow (OTP)

### Test 1.1: Send OTP
**Endpoint:** `POST /otp/{phone}/send`

```bash
curl -X POST "http://localhost:8000/otp/+972501234567/send"
```

**Expected Response:**
```json
{
  "message": "OTP sent successfully."
}
```

**✅ Verify:**
- Check console for OTP code (or SMS if Twilio configured)
- Check MongoDB `otp_verification` collection for new record

**🔴 Expected Errors to Test:**
```bash
# Invalid phone format (should still work but test edge case)
curl -X POST "http://localhost:8000/otp/invalid/send"
```

---

### Test 1.2: Verify OTP
**Endpoint:** `POST /otp/{phone}/verify`

**Get OTP from previous test (check console or MongoDB)**

```bash
curl -X POST "http://localhost:8000/otp/+972501234567/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "otp_code": "123456"
  }'
```

**Expected Response:**
```json
{
  "message": "OTP verified successfully.",
  "user": {
    "phone": "+972501234567",
    "allergies": [],
    "dietary_needs": []
  }
}
```

**✅ Verify:**
- User created in `users` collection
- OTP deleted from `otp_verification` collection (one-time use)

**🔴 Test Invalid OTP:**
```bash
curl -X POST "http://localhost:8000/otp/+972501234567/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "otp_code": "999999"
  }'
```

**Expected:** HTTP 400 - "Invalid or expired OTP."

---

### Test 1.3: Create Additional Test Users
Repeat Test 1.1 & 1.2 for:
- `+972507654321`
- `+972509876543`

---

## 2. User Profile Management

### Test 2.1: Get User Profile
**Endpoint:** `GET /users/{phone}`

```bash
curl "http://localhost:8000/users/+972501234567"
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "allergies": [],
  "dietary_needs": []
}
```

---

### Test 2.2: Add Allergies
**Endpoint:** `PUT /users/{phone}/allergies`

```bash
curl -X PUT "http://localhost:8000/users/+972507654321/allergies" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["peanuts", "dairy"]
  }'
```

**Expected Response:**
```json
{
  "phone": "+972507654321",
  "allergies": ["peanuts", "dairy"],
  "dietary_needs": []
}
```

**✅ Verify:**
- Check MongoDB that allergies are lowercase
- Duplicates should be prevented if added again

---

### Test 2.3: Add Dietary Needs
**Endpoint:** `PUT /users/{phone}/dietary-needs`

```bash
curl -X PUT "http://localhost:8000/users/+972509876543/dietary-needs" \
  -H "Content-Type: application/json" \
  -d '{
    "dietary_needs": ["vegan", "kosher"]
  }'
```

**Expected Response:**
```json
{
  "phone": "+972509876543",
  "allergies": [],
  "dietary_needs": ["vegan", "kosher"]
}
```

---

### Test 2.4: Remove Allergies
**Endpoint:** `DELETE /users/{phone}/allergies`

```bash
curl -X DELETE "http://localhost:8000/users/+972507654321/allergies" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["peanuts"]
  }'
```

**Expected Response:**
```json
{
  "phone": "+972507654321",
  "allergies": ["dairy"],
  "dietary_needs": []
}
```

**✅ Verify:** Only "peanuts" removed, "dairy" remains

---

### Test 2.5: Get User Status
**Endpoint:** `GET /users/{phone}/status`

```bash
curl "http://localhost:8000/users/+972501234567/status"
```

**Expected Response:**
```json
{
  "has_active_cart": false,
  "has_shopping_list": false
}
```

**📝 Note:** Will test again after creating cart/list

---

## 3. Product Discovery & Details

### Test 3.1: Search Products by Name
**Endpoint:** `GET /products/search?q={query}&limit={limit}`

```bash
# Search for milk products
curl "http://localhost:8000/products/search?q=milk&limit=5"
```

**Expected Response:**
```json
[
  {
    "barcode": "7290000065717",
    "name": "Tnuva Fresh Milk 3%",
    "company": "Tnuva",
    "category": "Milk",
    "price": 6.9,
    ...
  },
  ...
]
```

**✅ Test Different Queries:**
```bash
curl "http://localhost:8000/products/search?q=chocolate&limit=10"
curl "http://localhost:8000/products/search?q=pasta&limit=3"
curl "http://localhost:8000/products/search?q=coca&limit=5"
```

---

### Test 3.2: Get Nutritional Info
**Endpoint:** `GET /products/{barcode}/nutritional-info`

```bash
curl "http://localhost:8000/products/7290000065717/nutritional-info"
```

**Expected Response:**
```json
{
  "calories_per_100g": 64.0,
  "fat_per_100g": 3.0,
  "sodium_per_100mg": 50.0,
  "carbs_per_100g": 4.8,
  "sugar_per_100g": 4.8,
  "protein_per_100g": 3.2
}
```

---

### Test 3.3: Get Product Availability
**Endpoint:** `GET /products/{barcode}/availability`

```bash
curl "http://localhost:8000/products/7290000065717/availability"
```

**Expected Response:**
```json
{
  "available": true
}
```

---

### Test 3.4: Get Product Ingredients
**Endpoint:** `GET /products/{barcode}/ingredients`

```bash
curl "http://localhost:8000/products/7290000065717/ingredients"
```

**Expected Response:**
```json
{
  "ingredients": ["Fresh milk", "Vitamin D"]
}
```

---

### Test 3.5: Get Product Location
**Endpoint:** `GET /products/{barcode}/location`

```bash
curl "http://localhost:8000/products/7290000065717/location"
```

**Expected Response:**
```json
{
  "barcode": "7290000065717",
  "product_name": "Tnuva Fresh Milk 3%",
  "category": "Milk",
  "location": {
    "x": 1,
    "y": 5
  }
}
```

**✅ Verify:** Location matches category "Milk" from `maintenance/store_reference.json`

**🔴 Test Non-Existent Product:**
```bash
curl "http://localhost:8000/products/9999999999999/location"
```
**Expected:** HTTP 404 - "Product or location not found..."

---

## 4. Product Scanning & Conflict Detection

### Test 4.1: Scan Product - No Conflicts
**Endpoint:** `POST /products/scan/{barcode}`

**User with NO allergies/restrictions:**

```bash
curl -X POST "http://localhost:8000/products/scan/7290000065717" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": [],
    "dietary_needs": []
  }'
```

**Expected Response:**
```json
{
  "has_conflict": false,
  "original_product": {
    "barcode": "7290000065717",
    "name": "Tnuva Fresh Milk 3%",
    ...
  },
  "conflict_with_original": {
    "allergen_conflicts": [],
    "dietary_conflicts": [],
    "details": "No conflicts found"
  },
  "alternatives": [],
  "total_alternatives": 0
}
```

**✅ Verify:**
- `has_conflict` = false
- `alternatives` array is empty

---

### Test 4.2: Scan Product - WITH Allergen Conflict
**Barcode:** `7290000073101` (Bamba Peanut Snack)

```bash
curl -X POST "http://localhost:8000/products/scan/7290000073101" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["peanuts"],
    "dietary_needs": []
  }'
```

**Expected Response:**
```json
{
  "has_conflict": true,
  "original_product": {
    "barcode": "7290000073101",
    "name": "Bamba Peanut Snack",
    "allergens": ["peanuts"],
    ...
  },
  "conflict_with_original": {
    "allergen_conflicts": ["peanuts"],
    "dietary_conflicts": [],
    "details": "Contains allergens: peanuts."
  },
  "alternatives": [
    {
      "barcode": "7290000073804",
      "name": "Bissli BBQ Flavor",
      ...
    }
  ],
  "total_alternatives": 1
}
```

**✅ Verify:**
- `has_conflict` = true
- `allergen_conflicts` includes "peanuts"
- `alternatives` contains Bissli (no peanuts, same category "Snacks")
- Alternatives are limited to max 3

---

### Test 4.3: Scan Product - Dietary Need Conflict
**Barcode:** `7290000065717` (Tnuva Milk - not vegan)

```bash
curl -X POST "http://localhost:8000/products/scan/7290000065717" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": [],
    "dietary_needs": ["vegan"]
  }'
```

**Expected Response:**
```json
{
  "has_conflict": true,
  "original_product": {
    "name": "Tnuva Fresh Milk 3%",
    "dietary_tags": ["kosher", "vegetarian"],
    ...
  },
  "conflict_with_original": {
    "allergen_conflicts": [],
    "dietary_conflicts": ["vegan"],
    "details": "Missing dietary tags: vegan."
  },
  "alternatives": [
    {
      "name": "Alpro Soy Milk Unsweetened",
      "dietary_tags": ["vegan", "dairy-free", "kosher"],
      ...
    }
  ],
  "total_alternatives": 1
}
```

**✅ Verify:**
- `dietary_conflicts` includes "vegan"
- Alternatives have "vegan" tag
- Same category "Milk"

---

### Test 4.4: Multiple Conflicts (Allergen + Dietary)
**Barcode:** `7290000077321` (Strauss Ice Cream - has dairy + eggs, not vegan)

```bash
curl -X POST "http://localhost:8000/products/scan/7290000077321" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["dairy", "eggs"],
    "dietary_needs": ["vegan"]
  }'
```

**Expected Response:**
```json
{
  "has_conflict": true,
  "conflict_with_original": {
    "allergen_conflicts": ["dairy", "eggs"],
    "dietary_conflicts": ["vegan"],
    "details": "Contains allergens: dairy, eggs. Missing dietary tags: vegan."
  },
  "alternatives": [],
  "total_alternatives": 0
}
```

**✅ Verify:**
- Both allergen and dietary conflicts detected
- No alternatives (no vegan ice cream in test data)

---

## 5. AI-Powered Alternatives

### Test 5.1: AI Alternatives - "Less Sugar"
**Barcode:** `7290000068749` (Yoplait Strawberry Yogurt - 12g sugar)

```bash
curl -X POST "http://localhost:8000/products/7290000068749/ai-alternatives" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": [],
    "dietary_needs": [],
    "requirement": "I want something with less sugar"
  }'
```

**Expected Response:**
```json
{
  "alternatives": [
    {
      "barcode": "7290000069234",
      "name": "Danone Activia Light Yogurt",
      "nutritional_info": {
        "sugar_per_100g": 3.5
      },
      ...
    }
  ],
  "explanation": "These alternatives have 70% less sugar and use natural sweeteners"
}
```

**✅ Verify:**
- AI picks the lower sugar option (3.5g vs 12g)
- Explanation mentions sugar reduction
- Same category (Yogurts)

---

### Test 5.2: AI Alternatives - "Healthier Chocolate"
**Barcode:** `7290000071701` (Elite Milk Chocolate - 55g sugar)

```bash
curl -X POST "http://localhost:8000/products/7290000071701/ai-alternatives" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": [],
    "dietary_needs": [],
    "requirement": "I want a healthier chocolate option"
  }'
```

**Expected Response:**
```json
{
  "alternatives": [
    {
      "barcode": "7290000072234",
      "name": "Elite Dark Chocolate 70%",
      ...
    },
    {
      "barcode": "7290000072555",
      "name": "Elite Sugar Free Chocolate",
      ...
    }
  ],
  "explanation": "Dark chocolate has less sugar and more antioxidants"
}
```

**✅ Verify:**
- AI suggests dark chocolate and/or sugar-free
- Up to 3 alternatives
- Explanation is relevant

---

### Test 5.3: AI Alternatives - With Restrictions
**Barcode:** `7290000065717` (Tnuva Milk - has dairy)
**User is vegan**

```bash
curl -X POST "http://localhost:8000/products/7290000065717/ai-alternatives" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": [],
    "dietary_needs": ["vegan"],
    "requirement": "I want a vegan option"
  }'
```

**Expected Response:**
```json
{
  "alternatives": [
    {
      "barcode": "7290016770087",
      "name": "Alpro Soy Milk Unsweetened",
      "dietary_tags": ["vegan", "dairy-free", "kosher"],
      ...
    }
  ],
  "explanation": "Soy milk is a nutritious plant-based alternative"
}
```

**✅ Verify:**
- Only vegan alternatives returned
- Filters out non-vegan products
- AI explanation mentions vegan/plant-based

---

### Test 5.4: AI Alternatives - No Suitable Alternatives

```bash
curl -X POST "http://localhost:8000/products/7290000077321/ai-alternatives" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["dairy", "eggs", "soy"],
    "dietary_needs": ["vegan"],
    "requirement": "I want something without allergens"
  }'
```

**Expected Response:**
```json
{
  "alternatives": [],
  "explanation": "Couldn't find any alternatives that match your dietary restrictions"
}
```

**✅ Verify:**
- Empty alternatives array
- Appropriate message

---

## 6. Cart Session Management

### Test 6.1: Sync Cart Session (Create)
**Endpoint:** `POST /cart-session/{phone}/sync`

```bash
curl -X POST "http://localhost:8000/cart-session/+972501234567/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290000065717",
        "name": "Tnuva Fresh Milk 3%",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 3.2
        },
        "available": true,
        "quantity": 2
      },
      {
        "barcode": "7290000073804",
        "name": "Bissli BBQ Flavor",
        "image_url": "https://via.placeholder.com/150",
        "company": "Osem",
        "category": "Snacks",
        "price": 4.90,
        "size": "70g",
        "ingredients": ["Wheat flour", "Sunflower oil", "BBQ seasoning"],
        "allergens": ["gluten"],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
          "calories_per_100g": 480,
          "fat_per_100g": 21.0,
          "sodium_per_100mg": 820,
          "carbs_per_100g": 62.0,
          "sugar_per_100g": 8.0,
          "protein_per_100g": 9.0
        },
        "available": true,
        "quantity": 3
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true
}
```

**✅ Verify:**
- Check MongoDB `cart_session` collection
- `last_updated` timestamp is current

---

### Test 6.2: Get Cart Session
**Endpoint:** `GET /cart-session/{phone}`

```bash
curl "http://localhost:8000/cart-session/+972501234567"
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "items": [
    {
      "barcode": "7290000065717",
      "name": "Tnuva Fresh Milk 3%",
      "quantity": 2,
      ...
    },
    {
      "barcode": "7290000073804",
      "name": "Bissli BBQ Flavor",
      "quantity": 3,
      ...
    }
  ],
  "last_updated": "2025-..."
}
```

---

### Test 6.3: Update Cart Session (Sync Again)
**Change quantities and add item:**

```bash
curl -X POST "http://localhost:8000/cart-session/+972501234567/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290000065717",
        "name": "Tnuva Fresh Milk 3%",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 3.2
        },
        "available": true,
        "quantity": 1
      }
    ]
  }'
```

**✅ Verify:** Cart now has only 1 item with quantity 1

---

### Test 6.4: Verify User Status Shows Active Cart

```bash
curl "http://localhost:8000/users/+972501234567/status"
```

**Expected Response:**
```json
{
  "has_active_cart": true,
  "has_shopping_list": false
}
```

---

### Test 6.5: Delete Cart Session (Test Later After Checkout)
**Will test in checkout section**

---

## 7. Shopping List & Route Optimization

### Test 7.1: Create Shopping List with Route
**Endpoint:** `POST /shopping-list/{phone}`

**IMPORTANT:** Use products from different categories to test route optimization!

```bash
curl -X POST "http://localhost:8000/shopping-list/+972501234567" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290000065717",
        "name": "Tnuva Fresh Milk 3%",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 3.2
        },
        "available": true,
        "quantity": 2
      },
      {
        "barcode": "7290000071701",
        "name": "Elite Milk Chocolate Bar",
        "image_url": "https://via.placeholder.com/150",
        "company": "Elite",
        "category": "Chocolate",
        "price": 7.90,
        "size": "100g",
        "ingredients": ["Sugar", "Cocoa butter", "Milk powder"],
        "allergens": ["dairy", "soy"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
          "calories_per_100g": 530,
          "fat_per_100g": 30.0,
          "sodium_per_100mg": 80,
          "carbs_per_100g": 57.0,
          "sugar_per_100g": 55.0,
          "protein_per_100g": 7.0
        },
        "available": true,
        "quantity": 1
      },
      {
        "barcode": "7290000074320",
        "name": "Osem Pasta Spirals",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 12.0
        },
        "available": true,
        "quantity": 2
      },
      {
        "barcode": "7290000078120",
        "name": "Coca Cola",
        "image_url": "https://via.placeholder.com/150",
        "company": "Coca Cola",
        "category": "Soft Drinks",
        "price": 8.90,
        "size": "1.5L",
        "ingredients": ["Carbonated water", "Sugar", "Caramel color"],
        "allergens": [],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
          "calories_per_100g": 42,
          "fat_per_100g": 0,
          "sodium_per_100mg": 10,
          "carbs_per_100g": 10.6,
          "sugar_per_100g": 10.6,
          "protein_per_100g": 0
        },
        "available": true,
        "quantity": 1
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "items": [...],
  "category_order": ["Milk", "Chocolate", "Pasta", "Soft Drinks"],
  "route_coordinates": [
    {"x": 1, "y": 5},
    {"x": 9, "y": 4},
    {"x": 12, "y": 2},
    {"x": 3, "y": 7}
  ]
}
```

**✅ CRITICAL VERIFICATIONS:**
1. **category_order** is optimized (not just original order)
2. **route_coordinates** has matching coordinates for each category
3. Number of coordinates = number of categories
4. Coordinates match category locations from `store_reference.json`:
   - Milk: (1, 5) → W
   - Chocolate: (9, 4) → M
   - Pasta: (12, 2) → I
   - Soft Drinks: (3, 7) → X

**📝 Note:** The TSP algorithm should find the shortest path through all categories starting from entrance (E).

---

### Test 7.2: Get Shopping List

```bash
curl "http://localhost:8000/shopping-list/+972501234567"
```

**Expected:** Same response as Test 7.1

---

### Test 7.3: Update Shopping List (Add More Items)

```bash
curl -X POST "http://localhost:8000/shopping-list/+972501234567" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290000065717",
        "name": "Tnuva Fresh Milk 3%",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 3.2
        },
        "available": true,
        "quantity": 3
      },
      {
        "barcode": "7290000076805",
        "name": "Elite Instant Coffee",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 0.2
        },
        "available": true,
        "quantity": 1
      }
    ]
  }'
```

**✅ Verify:**
- List replaced with new items
- `category_order` recalculated with new categories
- `route_coordinates` updated

---

### Test 7.4: Verify User Status Shows Shopping List

```bash
curl "http://localhost:8000/users/+972501234567/status"
```

**Expected Response:**
```json
{
  "has_active_cart": true,
  "has_shopping_list": true
}
```

---

### Test 7.5: Delete Shopping List (Will Test Later)

---

## 8. Purchase Tracking & Checkout

### Test 8.1: Checkout Cart (First Purchase)
**Endpoint:** `POST /purchase-tracking/{phone}/checkout`

**Prerequisites:** Must have active cart (Test 6.1)

```bash
curl -X POST "http://localhost:8000/purchase-tracking/+972501234567/checkout"
```

**Expected Response:**
```json
{
  "message": "Checkout successful",
  "items_tracked": 1,
  "checkout_time": "2025-..."
}
```

**✅ CRITICAL VERIFICATIONS:**
1. Check MongoDB `product_purchase_tracking` collection:
   - New record created for barcode `7290000065717`
   - `phone`: "+972501234567"
   - `purchase_count`: 1
   - `purchase_dates`: Array with 1 timestamp
   - `average_interval_days`: null (need 2+ purchases)

2. Check `users` collection:
   - `last_checkout_date` is updated

3. Check `cart_session` collection:
   - Cart deleted after checkout

---

### Test 8.2: Verify Cart Deleted After Checkout

```bash
curl "http://localhost:8000/cart-session/+972501234567"
```

**Expected:** HTTP 404 - "No cart session found"

---

### Test 8.3: Simulate Multiple Purchases (For Testing Intervals)

**Create new cart and checkout again:**

```bash
# 1. Create cart with same product
curl -X POST "http://localhost:8000/cart-session/+972501234567/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290000065717",
        "name": "Tnuva Fresh Milk 3%",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 3.2
        },
        "available": true,
        "quantity": 1
      }
    ]
  }'

# 2. Checkout again
curl -X POST "http://localhost:8000/purchase-tracking/+972501234567/checkout"
```

**Expected Response:**
```json
{
  "message": "Checkout successful",
  "items_tracked": 1,
  "checkout_time": "2025-..."
}
```

**✅ Verify in MongoDB:**
- Same tracking record updated:
  - `purchase_count`: 2
  - `purchase_dates`: Array with 2 timestamps
  - `average_interval_days`: Should be calculated (probably very small since we did it immediately)

---

### Test 8.4: Checkout with Multiple Products

```bash
# Create cart with 3 different products
curl -X POST "http://localhost:8000/cart-session/+972501234567/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290000071701",
        "name": "Elite Milk Chocolate Bar",
        "image_url": "https://via.placeholder.com/150",
        "company": "Elite",
        "category": "Chocolate",
        "price": 7.90,
        "size": "100g",
        "ingredients": ["Sugar", "Cocoa butter"],
        "allergens": ["dairy", "soy"],
        "dietary_tags": ["kosher", "vegetarian"],
        "nutritional_info": {
          "calories_per_100g": 530,
          "fat_per_100g": 30.0,
          "sodium_per_100mg": 80,
          "carbs_per_100g": 57.0,
          "sugar_per_100g": 55.0,
          "protein_per_100g": 7.0
        },
        "available": true,
        "quantity": 2
      },
      {
        "barcode": "7290000073804",
        "name": "Bissli BBQ Flavor",
        "image_url": "https://via.placeholder.com/150",
        "company": "Osem",
        "category": "Snacks",
        "price": 4.90,
        "size": "70g",
        "ingredients": ["Wheat flour", "Sunflower oil"],
        "allergens": ["gluten"],
        "dietary_tags": ["kosher", "vegan"],
        "nutritional_info": {
          "calories_per_100g": 480,
          "fat_per_100g": 21.0,
          "sodium_per_100mg": 820,
          "carbs_per_100g": 62.0,
          "sugar_per_100g": 8.0,
          "protein_per_100g": 9.0
        },
        "available": true,
        "quantity": 1
      },
      {
        "barcode": "7290000076805",
        "name": "Elite Instant Coffee",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 0.2
        },
        "available": true,
        "quantity": 1
      }
    ]
  }'

# Checkout
curl -X POST "http://localhost:8000/purchase-tracking/+972501234567/checkout"
```

**Expected Response:**
```json
{
  "message": "Checkout successful",
  "items_tracked": 3,
  "checkout_time": "2025-..."
}
```

**✅ Verify:**
- 3 tracking records created (one for each unique barcode)
- Quantities don't affect tracking (only track that product was purchased)

---

## 9. Replenishment Suggestions

### Test 9.1: Get Suggestions (Too Early - No Results)
**Endpoint:** `POST /purchase-tracking/{phone}/suggestions`

**Note:** Since we just purchased, nothing will be "due" yet

```bash
curl -X POST "http://localhost:8000/purchase-tracking/+972501234567/suggestions" \
  -H "Content-Type: application/json" \
  -d '{
    "cart_barcodes": []
  }'
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "suggestions": [],
  "total_found": 0,
  "message": "No items are due for repurchase right now"
}
```

**✅ Verify:**
- Empty suggestions (products not due yet)

---

### Test 9.2: Manually Adjust Purchase Dates in MongoDB (For Testing)

**⚠️ MANUAL STEP:**
1. Open MongoDB Compass or mongosh
2. Find `product_purchase_tracking` collection
3. Find the record for milk (barcode `7290000065717`)
4. Edit `last_purchase_date` to be 7-10 days ago
5. Edit `average_interval_days` to be around 7
6. Save

**Alternative: Use MongoDB Shell:**
```javascript
db.product_purchase_tracking.updateOne(
  { phone: "+972501234567", barcode: "7290000065717" },
  {
    $set: {
      last_purchase_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      average_interval_days: 7
    }
  }
)
```

---

### Test 9.3: Get Suggestions (Should Return Results)

```bash
curl -X POST "http://localhost:8000/purchase-tracking/+972501234567/suggestions" \
  -H "Content-Type: application/json" \
  -d '{
    "cart_barcodes": []
  }'
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "suggestions": [
    {
      "barcode": "7290000065717",
      "name": "Tnuva Fresh Milk 3%",
      "category": "Milk",
      "price": 6.9,
      "days_since_last_purchase": 8,
      "average_purchase_interval": 7,
      "due_ratio": 1.14,
      "status": "overdue"
    }
  ],
  "total_found": 1,
  "message": "Found 1 item(s) due for repurchase based on your buying habits"
}
```

**✅ CRITICAL VERIFICATIONS:**
1. `due_ratio` > 1.0 (overdue)
2. `status` = "overdue"
3. Product details are complete
4. Only available products returned

---

### Test 9.4: Exclude Cart Items from Suggestions

```bash
curl -X POST "http://localhost:8000/purchase-tracking/+972501234567/suggestions" \
  -H "Content-Type: application/json" \
  -d '{
    "cart_barcodes": ["7290000065717"]
  }'
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "suggestions": [],
  "total_found": 0,
  "message": "No items are due for repurchase right now"
}
```

**✅ Verify:** Milk excluded because it's in cart

---

## 10. Edge Cases & Error Handling

### Test 10.1: Non-Existent User

```bash
curl "http://localhost:8000/users/+972509999999"
```

**Expected:** HTTP 404 - "User with phone '+972509999999' not found"

---

### Test 10.2: Non-Existent Product

```bash
curl "http://localhost:8000/products/9999999999999/nutritional-info"
```

**Expected:** HTTP 404 - "Product with barcode '9999999999999' not found"

---

### Test 10.3: Empty Shopping List

```bash
curl -X POST "http://localhost:8000/shopping-list/+972501234567" \
  -H "Content-Type: application/json" \
  -d '{
    "items": []
  }'
```

**Expected Response:**
```json
{
  "phone": "+972501234567",
  "items": [],
  "category_order": [],
  "route_coordinates": []
}
```

---

### Test 10.4: Checkout with No Cart

```bash
curl -X POST "http://localhost:8000/purchase-tracking/+972509876543/checkout"
```

**Expected:** HTTP 404 - "No cart session found for phone..."

---

### Test 10.5: Invalid OTP Code Format

```bash
curl -X POST "http://localhost:8000/otp/+972501234567/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "otp_code": "12"
  }'
```

**Expected:** HTTP 422 - Validation error (min_length 6)

---

### Test 10.6: Delete Non-Existent Shopping List

```bash
curl -X DELETE "http://localhost:8000/shopping-list/+972509999999"
```

**Expected:** HTTP 404 - "No shopping list found..."

---

## 11. Integration Test - Full User Journey

**This simulates a complete user flow from registration to checkout**

### Step 1: User Registration (OTP)
```bash
# Send OTP
curl -X POST "http://localhost:8000/otp/+972500000001/send"

# Verify OTP (use code from console)
curl -X POST "http://localhost:8000/otp/+972500000001/verify" \
  -H "Content-Type: application/json" \
  -d '{"otp_code": "YOUR_OTP_HERE"}'
```

**✅ Expected:** User created

---

### Step 2: Set User Preferences
```bash
# Add allergies
curl -X PUT "http://localhost:8000/users/+972500000001/allergies" \
  -H "Content-Type: application/json" \
  -d '{"allergies": ["dairy"]}'

# Check profile
curl "http://localhost:8000/users/+972500000001"
```

**✅ Expected:** Allergies added

---

### Step 3: Search for Products
```bash
curl "http://localhost:8000/products/search?q=milk&limit=5"
```

**✅ Expected:** List of milk products

---

### Step 4: Scan Product (Should Conflict)
```bash
# Scan regular milk (has dairy)
curl -X POST "http://localhost:8000/products/scan/7290000065717" \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["dairy"],
    "dietary_needs": []
  }'
```

**✅ Expected:** Conflict detected, alternatives suggested (Alpro Soy Milk)

---

### Step 5: Add Safe Alternative to Cart
```bash
curl -X POST "http://localhost:8000/cart-session/+972500000001/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290016770087",
        "name": "Alpro Soy Milk Unsweetened",
        "image_url": "https://via.placeholder.com/150",
        "company": "Alpro",
        "category": "Milk",
        "price": 11.90,
        "size": "1L",
        "ingredients": ["Water", "Soybeans (8%)"],
        "allergens": ["soy"],
        "dietary_tags": ["vegan", "dairy-free", "kosher"],
        "nutritional_info": {
          "calories_per_100g": 33,
          "fat_per_100g": 1.8,
          "sodium_per_100mg": 60,
          "carbs_per_100g": 0.5,
          "sugar_per_100g": 0,
          "protein_per_100g": 3.0
        },
        "available": true,
        "quantity": 2
      }
    ]
  }'
```

**✅ Expected:** Cart created

---

### Step 6: Create Shopping List
```bash
curl -X POST "http://localhost:8000/shopping-list/+972500000001" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "barcode": "7290016770087",
        "name": "Alpro Soy Milk Unsweetened",
        "image_url": "https://via.placeholder.com/150",
        "company": "Alpro",
        "category": "Milk",
        "price": 11.90,
        "size": "1L",
        "ingredients": ["Water", "Soybeans (8%)"],
        "allergens": ["soy"],
        "dietary_tags": ["vegan", "dairy-free", "kosher"],
        "nutritional_info": {
          "calories_per_100g": 33,
          "fat_per_100g": 1.8,
          "sodium_per_100mg": 60,
          "carbs_per_100g": 0.5,
          "sugar_per_100g": 0,
          "protein_per_100g": 3.0
        },
        "available": true,
        "quantity": 2
      },
      {
        "barcode": "7290000074320",
        "name": "Osem Pasta Spirals",
        "image_url": "https://via.placeholder.com/150",
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
          "protein_per_100g": 12.0
        },
        "available": true,
        "quantity": 1
      }
    ]
  }'
```

**✅ Expected:** Shopping list with optimized route

---

### Step 7: Check User Status
```bash
curl "http://localhost:8000/users/+972500000001/status"
```

**✅ Expected:** Both cart and shopping list active

---

### Step 8: Checkout
```bash
curl -X POST "http://localhost:8000/purchase-tracking/+972500000001/checkout"
```

**✅ Expected:**
- Checkout successful
- Cart deleted
- Purchase tracked

---

### Step 9: Verify Cart Deleted
```bash
curl "http://localhost:8000/cart-session/+972500000001"
```

**✅ Expected:** HTTP 404 - Cart deleted after checkout

---

### Step 10: Delete Shopping List
```bash
curl -X DELETE "http://localhost:8000/shopping-list/+972500000001"
```

**✅ Expected:** Shopping list deleted

---

## ✅ Final Checklist

After completing all tests, verify:

### Database Collections:
- [ ] `users` - Has test users with allergies/dietary needs
- [ ] `products` - Has 20 test products
- [ ] `categories` - Has category locations
- [ ] `cart_session` - Empty (deleted after checkout)
- [ ] `shopping_lists` - Empty or has active lists
- [ ] `product_purchase_tracking` - Has purchase history
- [ ] `otp_verification` - Empty (OTPs deleted after use)

### Features Working:
- [ ] OTP send/verify flow
- [ ] User profile CRUD (allergies, dietary needs)
- [ ] Product search
- [ ] Product details (nutrition, ingredients, location)
- [ ] Product scanning with conflict detection
- [ ] AI-powered alternatives with Gemini
- [ ] Cart session sync/get/delete
- [ ] Shopping list with route optimization
- [ ] Checkout with purchase tracking
- [ ] Replenishment suggestions
- [ ] Error handling (404s, validation)

### Critical Integrations:
- [ ] MongoDB connection stable
- [ ] Gemini API working (AI alternatives)
- [ ] Twilio SMS (if configured)
- [ ] Route optimization (TSP solver)
- [ ] BFS pathfinding for distances

---

## 🚨 Issues to Report

If any test fails, document:
1. **Test number** (e.g., Test 4.2)
2. **Expected behavior**
3. **Actual behavior**
4. **Error message** (if any)
5. **Request sent** (curl command)
6. **Response received**

---

## 📊 Performance Notes

During testing, observe:
- Response times for route optimization (should be <1s)
- AI alternatives response time (depends on Gemini API)
- Database query performance
- Memory usage during large cart operations

---

## 🎯 Production Readiness Criteria

✅ **READY FOR PRODUCTION** if:
- All tests pass without errors
- Error handling works correctly
- Route optimization produces valid results
- AI alternatives return relevant suggestions
- Purchase tracking calculates intervals correctly
- No data inconsistencies in MongoDB

🔴 **NOT READY** if:
- Any critical feature fails
- Data integrity issues found
- Performance is unacceptable
- Error messages are unclear

---

**Good luck with testing! 🚀**
