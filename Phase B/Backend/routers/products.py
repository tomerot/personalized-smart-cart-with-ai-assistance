from fastapi import APIRouter, HTTPException, status
from models import Product
from services import product as product_service
from schemas import (
    ProductResponse,
    NutritionalInfoResponse,
    ProductAvailabilityResponse,
    ProductIngredientsResponse,
    ProductLocationResponse,
    ConflictCheckResponse,
    FindAlternativesResponse,
)
from models import User
from typing import List

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
async def get_all_products():
    products = await Product.find().to_list()
    return products


@router.get("/{barcode}/nutritional-info", response_model=NutritionalInfoResponse)
async def get_product_nutritional_info(barcode: str):
    """
    Get product nutritional information only (optimized for VAPI AI).

    Args:
        barcode: Product barcode

    Returns:
        NutritionalInfoResponse: Nutritional data per 100g
    """
    product = await Product.find_one(Product.barcode == barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode '{barcode}' not found",
        )

    return product.nutritional_info


@router.get("/{barcode}/availability", response_model=ProductAvailabilityResponse)
async def get_product_availability(barcode: str):
    """
    Check product availability only (optimized for VAPI AI).

    Args:
        barcode: Product barcode

    Returns:
        ProductAvailabilityResponse: Barcode and availability status
    """
    product = await Product.find_one(Product.barcode == barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode '{barcode}' not found",
        )

    return {"barcode": product.barcode, "available": product.available}


@router.get("/{barcode}/ingredients", response_model=ProductIngredientsResponse)
async def get_product_ingredients(barcode: str):
    """
    Get product ingredients list only (optimized for VAPI AI).

    Args:
        barcode: Product barcode

    Returns:
        ProductIngredientsResponse: Barcode and ingredients list
    """
    product = await Product.find_one(Product.barcode == barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode '{barcode}' not found",
        )

    return {"barcode": product.barcode, "ingredients": product.ingredients}


@router.get("/{barcode}/location", response_model=ProductLocationResponse)
async def get_product_location(barcode: str):
    """
    Get product location in the supermarket based on its category.

    Args:
        barcode: Product barcode

    Returns:
        ProductLocationResponse: Product location with x,y coordinates
    """
    location = await product_service.get_product_location(barcode)

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product or location not found for barcode '{barcode}'",
        )

    return location


# in case we will need this - for now in comment
# @router.get("/{barcode}/check-conflicts/{phone}", response_model=ConflictCheckResponse)
# async def check_product_conflicts(barcode: str, phone: str):
#     """
#     Check if a product conflicts with user's allergies and dietary needs.

#     Args:
#         barcode: Product barcode
#         phone: User's phone number

#     Returns:
#         ConflictCheckResponse: Conflict details
#     """

#     # Get product
#     product = await Product.find_one(Product.barcode == barcode)
#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Product with barcode '{barcode}' not found",
#         )

#     # Get user
#     user = await User.find_one(User.phone == phone)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"User with phone '{phone}' not found",
#         )

#     # Check conflicts
#     conflict_result = product_service.check_product_conflicts(
#         product, user.allergies, user.dietary_needs
#     )

#     return conflict_result


@router.get("/{barcode}/alternatives/{phone}", response_model=FindAlternativesResponse)
async def find_alternative_products(barcode: str, phone: str):
    """
    Find alternative products that don't conflict with user preferences.

    This composite endpoint:
    1. Gets the original product
    2. Checks conflicts with user preferences
    3. If conflict exists: finds all products in same category and filters safe alternatives
    4. If no conflict: returns empty alternatives list

    Args:
        barcode: Original product barcode
        phone: User's phone number

    Returns:
        FindAlternativesResponse: Includes has_conflict flag, original product info,
        conflict details, and list of safe alternatives (only if conflict exists)
    """
    result = await product_service.find_alternative_products(barcode, phone)

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=result["error"]
        )

    return result


@router.get("/{barcode}/all-from-category", response_model=List[ProductResponse])
async def get_all_products_from_same_category(barcode: str):
    """
    Get all products from the same category as the specified product.

    Useful for AI to compare all alternatives and make recommendations
    based on nutritional info, price, etc.

    Args:
        barcode: Product barcode to get category from

    Returns:
        List[ProductResponse]: All products from the same category
    """
    # Get the product to find its category
    product = await Product.find_one(Product.barcode == barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode '{barcode}' not found",
        )

    # Get all products from the same category
    all_products = await Product.find(Product.category == product.category).to_list()

    return all_products
