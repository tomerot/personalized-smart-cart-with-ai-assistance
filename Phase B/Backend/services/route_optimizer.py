from typing import List, Dict, Tuple
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import json
import os


def solve_tsp(
    distance_matrix: Dict[Tuple[str, str], int],
    locations: List[str],
    start_location: str = "E"
) -> List[str]:
    """
    Solve TSP (Traveling Salesman Problem) to find optimal route.

    Args:
        distance_matrix: Dict mapping (from, to) pairs to distances
        locations: List of location names to visit (including start)
        start_location: Starting location (default: "E" for entrance)

    Returns:
        List[str]: Ordered list of locations to visit
        Example: ["E", "Dairy", "Snacks", "Bakery", "E"]
    """
    if not locations:
        return []

    # Ensure start location is in the list
    if start_location not in locations:
        locations = [start_location] + locations

    # Create index mapping
    location_to_index = {loc: idx for idx, loc in enumerate(locations)}
    index_to_location = {idx: loc for loc, idx in location_to_index.items()}

    num_locations = len(locations)

    # Build distance matrix for OR-Tools (2D list indexed by integers)
    distance_matrix_int = []
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            from_loc = index_to_location[i]
            to_loc = index_to_location[j]
            distance = distance_matrix.get((from_loc, to_loc), float('inf'))
            # Convert to int (OR-Tools needs integers)
            row.append(int(distance) if distance != float('inf') else 999999)
        distance_matrix_int.append(row)

    # Create routing model
    manager = pywrapcp.RoutingIndexManager(
        num_locations,
        1,  # Number of vehicles (1 = single route)
        location_to_index[start_location]  # Start depot index
    )
    routing = pywrapcp.RoutingModel(manager)

    # Define distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix_int[from_node][to_node]

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
        return locations  # Return original order if no solution

    # Extract route
    route = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        route.append(index_to_location[node])
        index = solution.Value(routing.NextVar(index))

    # Don't add end location (it's same as start)
    # route.append(index_to_location[manager.IndexToNode(index)])

    return route


def load_distance_matrix() -> Dict[Tuple[str, str], int]:
    """Load pre-calculated distance matrix from JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), "..", "distance_matrix.json")

    with open(json_path, "r") as f:
        distance_matrix_json = json.load(f)

    # Convert string keys back to tuple keys
    distance_matrix = {}
    for key, distance in distance_matrix_json.items():
        from_loc, to_loc = key.split("->")
        distance_matrix[(from_loc, to_loc)] = distance

    return distance_matrix


def calculate_shopping_route(categories: List[str]) -> List[str]:
    """
    Calculate optimized route for shopping list categories using pre-calculated distances.

    Args:
        categories: List of unique category names from shopping list

    Returns:
        List[str]: Optimized visit order starting from entrance
        Example: ["Dairy", "Snacks", "Bakery"]  (without entrance in result)
    """
    if not categories:
        return []

    # Remove duplicates
    unique_categories = list(set(categories))

    # Load pre-calculated distance matrix
    distance_matrix = load_distance_matrix()

    # Build list of locations to visit (entrance + categories)
    locations = ["E"] + unique_categories

    # Solve TSP
    route = solve_tsp(distance_matrix, locations, start_location="E")

    # Remove entrance from result (keep only categories)
    optimized_route = [loc for loc in route if loc != "E"]

    return optimized_route
