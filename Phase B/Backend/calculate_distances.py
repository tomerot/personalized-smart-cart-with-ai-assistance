"""
Script to calculate distance matrix from store layout.
Run this once when store layout changes.
"""

import json
from services.pathfinding import calculate_distance_matrix


def calculate_and_save_distances():
    """Calculate distance matrix from store_layout.json and save to distance_matrix.json"""

    # Load store layout
    with open("store_layout.json", "r") as f:
        layout = json.load(f)

    print("Loaded store layout")
    print(f"Grid size: {len(layout['grid'][0])}x{len(layout['grid'])}")

    # Build locations dict
    locations = {"E": (layout["entrance"]["x"], layout["entrance"]["y"])}

    for category, cat_data in layout["category_mapping"].items():
        locations[category] = (cat_data["x"], cat_data["y"])

    print(f"\nLocations to process: {list(locations.keys())}")

    # Calculate distance matrix
    distance_matrix = calculate_distance_matrix(layout["grid"], locations)

    # Convert tuple keys to string keys for JSON serialization
    distance_matrix_json = {}
    for (from_loc, to_loc), distance in distance_matrix.items():
        key = f"{from_loc}->{to_loc}"
        distance_matrix_json[key] = distance

    # Save to file
    with open("distance_matrix.json", "w") as f:
        json.dump(distance_matrix_json, f, indent=2)

    print(f"\n[SUCCESS] Distance matrix saved to distance_matrix.json")
    print(f"  Total pairs calculated: {len(distance_matrix_json)}")


if __name__ == "__main__":
    calculate_and_save_distances()
