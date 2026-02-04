"""
Route optimizer using Google OR-Tools TSP solver.

Uses pre-calculated grid distance matrix (grid_distance_matrix.json) and
fetches category positions from MongoDB at runtime.
"""

from typing import List, Dict, Tuple, Optional
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import json
import os

# Cache for the grid distance matrix (loaded once)
_grid_distance_cache: Optional[Dict] = None


def load_grid_distance_matrix() -> Tuple[np.ndarray, int, int]:
    """
    Load pre-calculated grid distance matrix (lazy, cached).
    
    Returns:
        Tuple of (distances_array, rows, cols)
    """
    global _grid_distance_cache
    
    if _grid_distance_cache is None:
        json_path = os.path.join(os.path.dirname(__file__), "..", "grid_distance_matrix.json")
        with open(json_path, "r") as f:
            data = json.load(f)
        
        _grid_distance_cache = {
            "distances": np.array(data["distances"], dtype=np.int32),
            "rows": data["rows"],
            "cols": data["cols"]
        }
        print(f"Loaded grid distance matrix: {data['rows']}x{data['cols']} grid")
    
    return (
        _grid_distance_cache["distances"],
        _grid_distance_cache["rows"],
        _grid_distance_cache["cols"]
    )


def get_entrance_position() -> Tuple[int, int]:
    """
    Get entrance position from store_layout.json.
    
    Returns:
        Tuple of (y, x) coordinates
    """
    json_path = os.path.join(os.path.dirname(__file__), "..", "store_layout.json")
    with open(json_path, "r") as f:
        layout = json.load(f)
    
    return (layout["entrance"]["y"], layout["entrance"]["x"])


def pos_to_index(y: int, x: int, cols: int) -> int:
    """Convert (y, x) position to matrix index."""
    return y * cols + x


def build_distance_matrix_for_positions(
    positions: List[Tuple[int, int]],
    names: List[str]
) -> Tuple[List[List[int]], Dict[str, int], Dict[int, str]]:
    """
    Build a distance matrix for specific positions using the pre-calculated grid distances.
    
    Args:
        positions: List of (y, x) tuples for each location
        names: List of location names (same order as positions)
    
    Returns:
        Tuple of:
        - 2D distance matrix (list of lists) for OR-Tools
        - name_to_index mapping
        - index_to_name mapping
    """
    distances, rows, cols = load_grid_distance_matrix()
    
    # Convert positions to grid indices
    grid_indices = [pos_to_index(y, x, cols) for y, x in positions]
    
    # Extract the submatrix using numpy fancy indexing
    filtered = distances[np.ix_(grid_indices, grid_indices)]
    
    # Build mappings
    name_to_index = {name: i for i, name in enumerate(names)}
    index_to_name = {i: name for i, name in enumerate(names)}
    
    # Convert to list for OR-Tools
    matrix = filtered.tolist()
    
    return matrix, name_to_index, index_to_name


def solve_tsp(
    distance_matrix: List[List[int]],
    num_locations: int,
    start_index: int = 0,
) -> List[int]:
    """
    Solve TSP (Traveling Salesman Problem) to find optimal route.
    
    Args:
        distance_matrix: 2D list of distances
        num_locations: Number of locations
        start_index: Index of starting location (default: 0)
    
    Returns:
        List[int]: Ordered list of indices representing the route
    """
    if num_locations <= 1:
        return list(range(num_locations))
    
    # Create routing model
    manager = pywrapcp.RoutingIndexManager(
        num_locations,
        1,  # Number of vehicles (1 = single route)
        start_index,  # Start depot index
    )
    routing = pywrapcp.RoutingModel(manager)
    
    # Define distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Set search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    
    # Solve
    solution = routing.SolveWithParameters(search_parameters)
    
    if not solution:
        print("No solution found for TSP")
        return list(range(num_locations))
    
    # Extract route
    route = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        route.append(node)
        index = solution.Value(routing.NextVar(index))
    
    return route


def calculate_shopping_route_with_positions(
    category_positions: Dict[str, Tuple[int, int]]
) -> List[str]:
    """
    Calculate optimized route given category names and their (y, x) positions.
    
    Args:
        category_positions: Dict mapping category name -> (y, x) position
            Example: {"Milk": (5, 1), "Bakery": (1, 2)}
    
    Returns:
        List[str]: Optimized category visit order (without entrance)
    """
    if not category_positions:
        return []
    
    # Get entrance position
    entrance_pos = get_entrance_position()
    
    # Build lists for all locations (entrance first)
    names = ["E"] + list(category_positions.keys())
    positions = [entrance_pos] + list(category_positions.values())
    
    # Build distance matrix
    distance_matrix, name_to_index, index_to_name = build_distance_matrix_for_positions(
        positions, names
    )
    
    # Solve TSP starting from entrance (index 0)
    route_indices = solve_tsp(distance_matrix, len(names), start_index=0)
    
    # Convert indices back to names, remove entrance
    route = [index_to_name[i] for i in route_indices if index_to_name[i] != "E"]
    
    return route
