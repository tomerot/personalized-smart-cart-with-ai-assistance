from models import Product, Category, User
from typing import List, Optional, Dict, Any


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
            "has_conflict": bool,
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

    has_conflict = len(allergen_conflicts) > 0 or len(dietary_conflicts) > 0

    details = ""
    if allergen_conflicts:
        details += f"Contains allergens: {', '.join(allergen_conflicts)}. "
    if dietary_conflicts:
        details += f"Missing dietary tags: {', '.join(dietary_conflicts)}."

    return {
        "has_conflict": has_conflict,
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


async def find_alternative_products(barcode: str, phone: str) -> Dict[str, Any]:
    """
    Find alternative products in the same category that don't conflict with user preferences.

    This is a composite function that:
    1. Gets the product by barcode
    2. Gets user preferences
    3. Checks conflicts with original product
    4. If conflict exists, fetches all products from same category and filters safe alternatives
    5. Returns original product info, conflict status, and alternatives (if conflict exists)

    Args:
        barcode: Original product barcode
        phone: User's phone number

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

        # 2. Get user preferences
        user = await User.find_one(User.phone == phone)
        if not user:
            return {
                "error": f"User with phone '{phone}' not found",
            }

        # Check conflict with original product
        original_conflict = check_product_conflicts(
            product, user.allergies, user.dietary_needs
        )

        # Only fetch alternatives if there's a conflict
        safe_alternatives = []
        if original_conflict["has_conflict"]:
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
                    alt_product, user.allergies, user.dietary_needs
                )

                if not conflict_check["has_conflict"]:
                    safe_alternatives.append(
                        {
                            "barcode": alt_product.barcode,
                            "name": alt_product.name,
                            "image_url": alt_product.image_url,
                            "company": alt_product.company,
                            "price": alt_product.price,
                            "category": alt_product.category,
                            "size": alt_product.size,
                            "dietary_tags": alt_product.dietary_tags,
                            "allergens": alt_product.allergens,
                        }
                    )

            print(
                f"Found {len(safe_alternatives)} safe alternatives for product {barcode}"
            )

        # Limit to 3 alternatives
        limited_alternatives = safe_alternatives[:3]

        return {
            "has_conflict": original_conflict["has_conflict"],
            "original_product": {
                "barcode": product.barcode,
                "name": product.name,
                "company": product.company,
                "category": product.category,
                "price": product.price,
                "image": product.image_url,
            },
            "conflict_with_original": original_conflict,
            "alternatives": limited_alternatives,
            "total_alternatives": len(safe_alternatives),
        }

    except Exception as e:
        print(f"Error in find_alternative_products: {e}")
        raise
