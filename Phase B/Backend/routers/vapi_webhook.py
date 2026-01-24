from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from models import Product
from services import product as product_service
from services import user as user_service
from typing import Dict

router = APIRouter(tags=["VAPI Webhook"])


@router.post("/vapi-webhook")
async def vapi_webhook(request: Request):
    """
    Webhook endpoint for VAPI voice assistant.
    Handles VAPI's request format and routes to the appropriate service function.
    """
    body = await request.json()

    # Extract tool call info from VAPI's format
    tool_calls = body.get("message", {}).get("toolCalls", [])
    if not tool_calls:
        return {"results": [{"toolCallId": "", "result": "No tool call found"}]}

    tool_call = tool_calls[0]
    tool_call_id = tool_call.get("id", "")
    function_name = tool_call.get("function", {}).get("name", "")
    arguments = tool_call.get("function", {}).get("arguments", {})

    # Route to the appropriate handler
    if function_name == "get_product_info":
        query = arguments.get("name", "")
        result = await handle_product_info(query)

    elif function_name == "get_nutrition_details":
        barcode = arguments.get("barcode", "")
        result = await handle_nutrition_details(barcode)

    elif function_name == "get_ai_alternatives":
        barcode = arguments.get("barcode", "")
        allergies = arguments.get("allergies", [])
        dietary_needs = arguments.get("dietary_needs", [])
        requirement = arguments.get("requirement", "")
        result = await handle_ai_alternatives(
            barcode, allergies, dietary_needs, requirement
        )
    elif function_name == "add_allergies":
        phone = arguments.get("phone", "")
        allergies = arguments.get("allergies", [])
        result = await handle_add_allergies(phone, allergies)

    elif function_name == "remove_allergies":
        phone = arguments.get("phone", "")
        allergies = arguments.get("allergies", [])
        result = await handle_remove_allergies(phone, allergies)

    elif function_name == "add_dietary_needs":
        phone = arguments.get("phone", "")
        dietary_needs = arguments.get("dietary_needs", [])
        result = await handle_add_dietary_needs(phone, dietary_needs)

    elif function_name == "remove_dietary_needs":
        phone = arguments.get("phone", "")
        dietary_needs = arguments.get("dietary_needs", [])

        result = await handle_remove_dietary_needs(phone, dietary_needs)
    else:
        result = f"Unknown function: {function_name}"

    return {"results": [{"toolCallId": tool_call_id, "result": result}]}


async def handle_product_info(query: str):
    """Handle product info lookup and return location and availability."""
    if not query:
        return "Missing product name"

    result = await product_service.get_product_info(query)

    if not result:
        return f"No products or categories found matching '{query}'"

    if not result["products"]:
        # Category match only
        return {
            "category": result["category"],
            "location": result["location"],
        }
    else:
        # Product match
        product = result["products"][0]
        return {
            "name": product["name"],
            "available": product["available"],
            "category": result["category"],
            "location": result["location"],
        }


async def handle_nutrition_details(barcode: str) -> str:
    """Handle nutrition details lookup and return a string response."""
    if not barcode:
        return "Missing product barcode"

    product = await Product.find_one(Product.barcode == barcode)
    if not product:
        return f"Product with barcode '{barcode}' not found"

    info = product.nutritional_info
    return (
        f"Product: {product.name}. "
        f"Ingredients: {', '.join(product.ingredients)}. "
        f"Nutritional info per 100g: "
        f"Calories: {info.calories_per_100g}, "
        f"Fat: {info.fat_per_100g}g, "
        f"Carbs: {info.carbs_per_100g}g, "
        f"Sugar: {info.sugar_per_100g}g, "
        f"Protein: {info.protein_per_100g}g, "
        f"Sodium: {info.sodium_per_100mg}mg."
    )


async def handle_ai_alternatives(
    barcode: str, allergies: list, dietary_needs: list, requirement: str
):
    """Handle AI alternatives and return structured data."""
    if not barcode:
        return "Missing product barcode"

    try:
        result = await product_service.get_ai_recommended_alternatives(
            barcode=barcode,
            allergies=allergies,
            dietary_needs=dietary_needs,
            requirement=requirement,
        )
        return result
    except ValueError as e:
        return str(e)
    except Exception as e:
        return f"Error finding alternatives: {str(e)}"


async def handle_add_allergies(phone: str, allergies: list) -> str:
    """Handle adding allergies to user profile."""
    if not phone:
        return "Missing user phone number"
    if not allergies:
        return "No allergies provided to add"

    user = await user_service.add_user_allergies(phone, allergies)
    if not user:
        return f"User with phone '{phone}' not found"

    return f"Added {', '.join(allergies)} to your allergies list. Your current allergies: {', '.join(user.allergies)}."


async def handle_remove_allergies(phone: str, allergies: list) -> str:
    """Handle removing allergies from user profile."""
    if not phone:
        return "Missing user phone number"
    if not allergies:
        return "No allergies provided to remove"

    user = await user_service.remove_user_allergies(phone, allergies)
    if not user:
        return f"User with phone '{phone}' not found"

    remaining = user.allergies if user.allergies else []
    if remaining:
        return f"Removed {', '.join(allergies)} from your allergies list. Your remaining allergies: {', '.join(remaining)}."
    return f"Removed {', '.join(allergies)} from your allergies list. You have no allergies listed now."


async def handle_add_dietary_needs(phone: str, dietary_needs: list) -> str:
    """Handle adding dietary needs to user profile."""
    if not phone:
        return "Missing user phone number"
    if not dietary_needs:
        return "No dietary needs provided to add"

    user = await user_service.add_user_dietary_needs(phone, dietary_needs)
    if not user:
        return f"User with phone '{phone}' not found"

    return f"Added {', '.join(dietary_needs)} to your dietary needs. Your current dietary needs: {', '.join(user.dietary_needs)}."


async def handle_remove_dietary_needs(phone: str, dietary_needs: list) -> str:
    """Handle removing dietary needs from user profile."""
    if not phone:
        return "Missing user phone number"
    if not dietary_needs:
        return "No dietary needs provided to remove"

    user = await user_service.remove_user_dietary_needs(phone, dietary_needs)
    if not user:
        return f"User with phone '{phone}' not found"

    remaining = user.dietary_needs if user.dietary_needs else []
    if remaining:
        return f"Removed {', '.join(dietary_needs)} from your dietary needs. Your remaining dietary needs: {', '.join(remaining)}."
    return f"Removed {', '.join(dietary_needs)} from your dietary needs. You have no dietary needs listed now."
