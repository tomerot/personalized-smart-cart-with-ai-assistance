from typing import List, Dict, Tuple, Optional
from collections import deque


def bfs_distance(grid: List[List[str]], start: Tuple[int, int], end: Tuple[int, int]) -> Optional[int]:
    """
    Calculate shortest walking distance between two points using BFS.

    Args:
        grid: 2D grid where # = wall, everything else is walkable
        start: Starting (x, y) coordinates
        end: Ending (x, y) coordinates

    Returns:
        int: Number of steps, or None if path doesn't exist
    """
    if not grid or not grid[0]:
        return None

    rows = len(grid)
    cols = len(grid[0])

    start_x, start_y = start
    end_x, end_y = end

    # Bounds check
    if not (0 <= start_x < cols and 0 <= start_y < rows):
        return None
    if not (0 <= end_x < cols and 0 <= end_y < rows):
        return None

    # Check if start or end is a wall
    if grid[start_y][start_x] == "#" or grid[end_y][end_x] == "#":
        return None

    # BFS
    queue = deque([(start_x, start_y, 0)])  # (x, y, distance)
    visited = set()
    visited.add((start_x, start_y))

    # 4 directions: right, down, left, up
    directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]

    while queue:
        x, y, dist = queue.popleft()

        # Found the target
        if x == end_x and y == end_y:
            return dist

        # Explore neighbors
        for dx, dy in directions:
            nx, ny = x + dx, y + dy

            # Check bounds
            if 0 <= nx < cols and 0 <= ny < rows:
                # Check if walkable and not visited
                if grid[ny][nx] != "#" and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny, dist + 1))

    # No path found
    return None


def calculate_distance_matrix(
    grid: List[List[str]],
    locations: Dict[str, Tuple[int, int]]
) -> Dict[Tuple[str, str], int]:
    """
    Calculate distance matrix between all locations.

    Args:
        grid: 2D store layout grid
        locations: Dict mapping location names to (x, y) coordinates
            Example: {"E": (1, 1), "Dairy": (5, 3), "Snacks": (2, 7)}

    Returns:
        Dict mapping (from, to) pairs to distances
        Example: {("E", "Dairy"): 8, ("Dairy", "Snacks"): 5, ...}
    """
    distance_matrix = {}
    location_names = list(locations.keys())

    # Calculate distance between every pair
    for i, from_loc in enumerate(location_names):
        for to_loc in location_names[i:]:  # Avoid duplicates
            if from_loc == to_loc:
                distance_matrix[(from_loc, to_loc)] = 0
                continue

            from_coords = locations[from_loc]
            to_coords = locations[to_loc]

            distance = bfs_distance(grid, from_coords, to_coords)

            if distance is not None:
                # Store both directions (symmetric)
                distance_matrix[(from_loc, to_loc)] = distance
                distance_matrix[(to_loc, from_loc)] = distance
            else:
                # No path exists
                print(f"Warning: No path between {from_loc} and {to_loc}")
                distance_matrix[(from_loc, to_loc)] = float('inf')
                distance_matrix[(to_loc, from_loc)] = float('inf')

    return distance_matrix
