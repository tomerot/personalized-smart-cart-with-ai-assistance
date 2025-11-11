from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(prefix="/store", tags=["Store"])


@router.get("/layout")
async def get_store_layout():
    """
    Get the store layout including grid, entrance, and category positions.
    Used by frontend to display the store map.
    """
    try:
        json_path = os.path.join(os.path.dirname(__file__), "..", "store_layout.json")

        with open(json_path, "r") as f:
            layout = json.load(f)

        return layout

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Store layout file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid store layout file format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading store layout: {str(e)}")
