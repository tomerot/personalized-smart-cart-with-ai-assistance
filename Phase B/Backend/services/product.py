from models import Product, Category
from typing import List, Optional, Dict, Any
from clients import get_gemini_client
import json


async def get_products_by_category(category: str) -> List[Product]:
    """
    Get all products in a specific category.

    Args:
        category: Category name

    Returns:
        List[Product]: List of products in the category
    """
    try:
        products = await Product.find(Product.category == category).to_list()
        print(f"Found {len(products)} products in category: {category}")
        return products
    except Exception as e:
        print(f"Error in get_products_by_category: {e}")
        raise


def check_product_conflicts(
    product: Product, user_allergies: List[str], user_dietary_needs: List[str]
) -> Dict[str, Any]:
    """
    Check if a product conflicts with user's allergies or dietary needs.

    Args:
        product: Product to check
        user_allergies: List of user's allergies
        user_dietary_needs: List of user's dietary needs

    Returns:
        Dict with conflict information:
        {
            "allergen_conflicts": List[str],
            "dietary_conflicts": List[str],
            "details": str
        }
    """
    allergen_conflicts = []
    dietary_conflicts = []

    # Check allergen conflicts
    for allergen in product.allergens:
        if allergen.lower() in [a.lower() for a in user_allergies]:
            allergen_conflicts.append(allergen)

    # Check dietary needs conflicts
    # If user is vegan, product must have "vegan" tag
    # If user is kosher, product must have "kosher" tag, etc.
    for need in user_dietary_needs:
        need_lower = need.lower()
        product_tags_lower = [tag.lower() for tag in product.dietary_tags]

        if need_lower not in product_tags_lower:
            dietary_conflicts.append(need)

    details = ""
    if allergen_conflicts:
        details += f"Contains allergens: {', '.join(allergen_conflicts)}. "
    if dietary_conflicts:
        details += f"Missing dietary tags: {', '.join(dietary_conflicts)}."

    return {
        "allergen_conflicts": allergen_conflicts,
        "dietary_conflicts": dietary_conflicts,
        "details": details.strip() if details else "No conflicts found",
    }


async def get_product_location(barcode: str) -> Optional[Dict[str, Any]]:
    """
    Get product location based on its category.

    Args:
        barcode: Product barcode

    Returns:
        Dict with location info or None if not found:
        {
            "barcode": str,
            "product_name": str,
            "category": str,
            "location": {"x": int, "y": int}
        }
    """
    try:
        # Get product
        product = await Product.find_one(Product.barcode == barcode)
        if not product:
            print(f"Product not found for barcode: {barcode}")
            return None

        # Get category with location
        category = await Category.find_one(Category.name == product.category)
        if not category:
            print(f"Category not found: {product.category}")
            return None

        return {
            "barcode": product.barcode,
            "product_name": product.name,
            "category": product.category,
            "location": {"x": category.location.x, "y": category.location.y},
        }
    except Exception as e:
        print(f"Error in get_product_location: {e}")
        raise


async def scan_with_conflict_check_and_alternatives(
    barcode: str, user_allergies: List[str], user_dietary_needs: List[str]
) -> Dict[str, Any]:
    """
    Find alternative products in the same category that don't conflict with user preferences.

    This is a composite function that:
    1. Gets the product by barcode
    2. Checks conflicts with user preferences (allergies/dietary needs)
    3. If conflict exists, fetches all products from same category and filters safe alternatives
    4. Returns original product info, conflict status, and alternatives (if conflict exists)

    Args:
        barcode: Original product barcode
        user_allergies: List of user's allergies
        user_dietary_needs: List of user's dietary needs

    Returns:
        Dict with:
        {
            "has_conflict": bool,
            "original_product": {...},
            "conflict_with_original": {...},
            "alternatives": [...],  # Empty if no conflict
            "total_alternatives": int
        }
    """
    try:
        # 1. Get original product
        product = await Product.find_one(Product.barcode == barcode)
        if not product:
            return {
                "error": f"Product with barcode '{barcode}' not found",
            }

        # 2. Check conflict with original product
        original_conflict = check_product_conflicts(
            product, user_allergies, user_dietary_needs
        )

        # Determine if there's a conflict
        has_conflict = len(original_conflict["allergen_conflicts"]) > 0 or len(original_conflict["dietary_conflicts"]) > 0

        # Only fetch alternatives if there's a conflict
        safe_alternatives = []
        if has_conflict:
            # 3. Fetch all products from same category
            all_products = await get_products_by_category(product.category)

            # 4. Filter products without conflicts
            for alt_product in all_products:
                # Skip the original product
                if alt_product.barcode == barcode:
                    continue

                # Skip unavailable products
                if not alt_product.available:
                    continue

                # Check for conflicts
                conflict_check = check_product_conflicts(
                    alt_product, user_allergies, user_dietary_needs
                )

                # Check if alternative has conflict
                has_alt_conflict = len(conflict_check["allergen_conflicts"]) > 0 or len(conflict_check["dietary_conflicts"]) > 0

                if not has_alt_conflict:
                    safe_alternatives.append(alt_product)

            print(
                f"Found {len(safe_alternatives)} safe alternatives for product {barcode}"
            )

        # Limit to 3 alternatives
        limited_alternatives = safe_alternatives[:3]

        return {
            "has_conflict": has_conflict,
            "original_product": product,
            "conflict_with_original": original_conflict,
            "alternatives": limited_alternatives,
            "total_alternatives": len(safe_alternatives),
        }

    except Exception as e:
        print(f"Error in find_alternative_products: {e}")
        raise


async def get_ai_recommended_alternatives(
    barcode: str,
    allergies: List[str],
    dietary_needs: List[str],
    requirement: str,
) -> Dict[str, Any]:
    """
    Get AI-recommended alternative products using Google Gemini.

    This function:
    1. Finds all alternatives in the same category as the original product
    2. Filters by availability and user restrictions (allergies/dietary needs)
    3. Sends filtered alternatives to Gemini AI with user's requirement
    4. Returns top 3 AI-recommended alternatives with explanations

    Args:
        barcode: Original product barcode
        allergies: List of user's allergies
        dietary_needs: List of user's dietary needs
        requirement: User's specific requirement (e.g., "less sugar", "cheaper")

    Returns:
        Dict with:
        {
            "original_product": Product,
            "requirement": str,
            "top_alternatives": [
                {
                    "product": Product,
                    "explanation": str
                }
            ]
        }
    """
    try:
        # 1. Get original product
        original_product = await Product.find_one(Product.barcode == barcode)
        if not original_product:
            raise ValueError(f"Product with barcode '{barcode}' not found")

        # 2. Get all products from same category
        all_products = await get_products_by_category(original_product.category)

        # 3. Filter alternatives (same category, available, no conflicts, not original)
        safe_alternatives = []
        for product in all_products:
            # Skip original product
            if product.barcode == barcode:
                continue

            # Skip unavailable products
            if not product.available:
                continue

            # Check for conflicts
            conflict_check = check_product_conflicts(product, allergies, dietary_needs)
            has_conflict = len(conflict_check["allergen_conflicts"]) > 0 or len(conflict_check["dietary_conflicts"]) > 0

            if not has_conflict:
                safe_alternatives.append(product)

        print(f"Found {len(safe_alternatives)} safe alternatives for AI processing")

        if len(safe_alternatives) == 0:
            return {
                "alternatives": [],
                "explanation": "Couldn't find any alternatives that match your dietary restrictions",
            }

        # Determine how many alternatives to request (max 3)
        num_alternatives = min(len(safe_alternatives), 3)

        # 4. Prepare data for Gemini
        alternatives_data = []
        for product in safe_alternatives:
            alternatives_data.append(
                {
                    "barcode": product.barcode,
                    "name": product.name,
                    "company": product.company,
                    "price": product.price,
                    "size": product.size,
                    "ingredients": product.ingredients,
                    "allergens": product.allergens,
                    "dietary_tags": product.dietary_tags,
                    "nutritional_info": {
                        "calories_per_100g": product.nutritional_info.calories_per_100g,
                        "fat_per_100g": product.nutritional_info.fat_per_100g,
                        "sodium_per_100mg": product.nutritional_info.sodium_per_100mg,
                        "carbs_per_100g": product.nutritional_info.carbs_per_100g,
                        "sugar_per_100g": product.nutritional_info.sugar_per_100g,
                        "protein_per_100g": product.nutritional_info.protein_per_100g,
                    },
                }
            )

        # 5. Get Gemini client
        gemini_client = get_gemini_client()

        # 6. Create prompt for Gemini
        prompt = f"""
You are a smart shopping assistant. Given the following list of alternative products and a user requirement,
select the TOP {num_alternatives} BEST product(s) that match the requirement.

User Requirement: "{requirement}"

Original Product:
- Name: {original_product.name}
- Company: {original_product.company}
- Price: ${original_product.price}
- Size: {original_product.size}
- Ingredients: {original_product.ingredients}
- Nutritional info: {original_product.nutritional_info}

Available Alternatives (all safe for user's dietary restrictions):
{json.dumps(alternatives_data, indent=2)}

Your task:
1. Analyze each alternative product based on the user's requirement
2. Select the TOP {num_alternatives} product(s) that best match the requirement
3. Provide ONE overall explanation (max 20 words) why these alternatives were chosen
4. IMPORTANT: Each product must be UNIQUE - do NOT repeat the same barcode

IMPORTANT: Return your response ONLY as a valid JSON object with exactly {num_alternatives} product(s) in this format:
{{
  "barcodes": ["barcode1", "barcode2", "barcode3"],
  "explanation": "Brief overall explanation for all alternatives (max 20 words)"
}}

Do not include any other text, markdown formatting, or code blocks. Return ONLY the JSON object.
"""

        # 7. Get Gemini response
        print(f"Sending request to Gemini with requirement: {requirement}")
        response_text = gemini_client.generate_content(prompt)

        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]  # Remove ```json
        if response_text.startswith("```"):
            response_text = response_text[3:]  # Remove ```
        if response_text.endswith("```"):
            response_text = response_text[:-3]  # Remove ```
        response_text = response_text.strip()

        print(f"Gemini response: {response_text}")

        # 8. Parse Gemini response
        gemini_result = json.loads(response_text)

        # 9. Build final response (ensure no duplicates)
        recommended_barcodes = gemini_result.get("barcodes", [])
        ai_explanation = gemini_result.get("explanation", "")

        alternatives = []
        seen_barcodes = set()

        for barcode in recommended_barcodes:
            # Skip if we've already added this product
            if barcode in seen_barcodes:
                continue

            # Find the product object
            product_obj = next(
                (p for p in safe_alternatives if p.barcode == barcode),
                None,
            )

            if product_obj:
                alternatives.append(product_obj)
                seen_barcodes.add(barcode)

        # Use AI explanation if alternatives found, otherwise default message
        if len(alternatives) == 0:
            explanation_msg = "Couldn't find any alternatives"
        else:
            explanation_msg = ai_explanation

        return {
            "alternatives": alternatives,
            "explanation": explanation_msg,
        }

    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini response: {e}")
        print(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        print(f"Error in get_ai_recommended_alternatives: {e}")
        raise
