from fastapi import APIRouter, HTTPException, status
from models import Product
from services import product as product_service
from schemas import (
    ProductResponse,
    NutritionalInfoResponse,
    ProductAvailabilityResponse,
    ProductIngredientsResponse,
    NutritionDetailsResponse,
    ShelfInfoResponse,
    ProductLocationResponse,
    FindAlternativesResponse,
    ProductScanRequest,
    AIAlternativesRequest,
    AIAlternativesResponse,
)
from typing import List

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/search", response_model=List[ProductResponse])
async def search_products(q: str, limit: int = 5):
    """
    Search products by name.

    Args:
        q: Search query (product name)
        limit: Maximum number of results to return (default: 5)

    Returns:
        List[ProductResponse]: Products matching the search query
    """
    # Use case-insensitive regex search on product name
    products = (
        await Product.find({"name": {"$regex": q, "$options": "i"}})
        .limit(limit)
        .to_list()
    )

    return products


@router.get("/{barcode}/nutritional-info", response_model=NutritionalInfoResponse)
async def get_product_nutritional_info(barcode: str):
    """
    Get product nutritional information only.

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
    Check product availability only.

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

    return {"available": product.available}


@router.get("/{barcode}/ingredients", response_model=ProductIngredientsResponse)
async def get_product_ingredients(barcode: str):
    """
    Get product ingredients list only.

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

    return {"ingredients": product.ingredients}


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


@router.get("/{barcode}/nutrition-details", response_model=NutritionDetailsResponse)
async def get_product_nutrition_details(barcode: str):
    """
    Get product ingredients and nutritional info combined.
    Used for AI function calling.

    Args:
        barcode: Product barcode

    Returns:
        NutritionDetailsResponse: Ingredients list and nutritional info
    """
    product = await Product.find_one(Product.barcode == barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode '{barcode}' not found",
        )

    return {
        "ingredients": product.ingredients,
        "nutritional_info": product.nutritional_info,
    }


@router.get("/{barcode}/shelf-info", response_model=ShelfInfoResponse)
async def get_product_shelf_info(barcode: str):
    """
    Get product availability and location combined.
    Used for AI function calling.

    Args:
        barcode: Product barcode

    Returns:
        ShelfInfoResponse: Availability status and location coordinates
    """
    product = await Product.find_one(Product.barcode == barcode)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode '{barcode}' not found",
        )

    # Get location (may be None if category not found)
    location = await product_service.get_product_location(barcode)

    return {
        "available": product.available,
        "location": location["location"] if location else None,
    }


@router.post("/{barcode}/scan", response_model=FindAlternativesResponse)
async def scan_product_with_alternatives(barcode: str, request: ProductScanRequest):
    """
    Scan a product and find alternatives if there are conflicts with user preferences.

    This endpoint:
    1. Gets the scanned product
    2. Checks conflicts with user's allergies and dietary needs
    3. If conflict exists: finds safe alternative products in the same category
    4. If no conflict: returns empty alternatives list

    Args:
        barcode: Product barcode being scanned
        request: ProductScanRequest with user's allergies and dietary_needs

    Returns:
        FindAlternativesResponse: Includes has_conflict flag, original product info,
        conflict details, and list of safe alternatives (only if conflict exists)
    """
    result = await product_service.scan_with_conflict_check_and_alternatives(
        barcode, request.allergies, request.dietary_needs
    )

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=result["error"]
        )

    return result


@router.post("/{barcode}/ai-alternatives", response_model=AIAlternativesResponse)
async def get_ai_recommended_alternatives(barcode: str, request: AIAlternativesRequest):
    """
    Get AI-recommended alternative products using Google Gemini.

    This endpoint:
    1. Finds alternatives in the same category as the original product
    2. Filters by availability and user restrictions (allergies/dietary needs)
    3. Uses Gemini AI to analyze alternatives based on user's specific requirement
    4. Returns top 3 AI-recommended alternatives with explanations

    Args:
        barcode: Original product barcode
        request: AIAlternativesRequest with allergies, dietary_needs, and requirement

    Returns:
        AIAlternativesResponse: Alternatives list and overall explanation message

    Example request body:
    {
        "allergies": ["peanuts", "dairy"],
        "dietary_needs": ["vegan"],
        "requirement": "I want something with less sugar"
    }

    Example response (with alternatives):
    {
        "alternatives": [
            {...full product 1 data...},
            {...full product 2 data...}
        ],
        "explanation": "These alternatives have 30% less sugar and use natural sweeteners"
    }

    Example response (no alternatives):
    {
        "alternatives": [],
        "explanation": "Couldn't find any alternatives that match your dietary restrictions"
    }
    """
    try:
        result = await product_service.get_ai_recommended_alternatives(
            barcode=barcode,
            allergies=request.allergies,
            dietary_needs=request.dietary_needs,
            requirement=request.requirement,
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        print(f"Error in AI alternatives endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI recommendations: {str(e)}",
        )
