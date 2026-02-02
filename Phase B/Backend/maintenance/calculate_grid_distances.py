"""
Calculate full grid-based distance matrix.
Run this ONLY when the store grid layout changes.

Output: grid_distance_matrix.json with a 2D array where:
- distances[i][j] = BFS distance from point_i to point_j
- Index formula: index = y * cols + x
- Walls/unreachable cells have distance = -1
"""

import json
import os
from typing import List, Dict, Tuple
from collections import deque

UNWALKABLE_SYMBOLS = {"#", "*", "%"}


def bfs_from_point(grid: List[List[str]], start_y: int, start_x: int, rows: int, cols: int) -> Dict[int, int]:
    """
    Calculate distances from one point to ALL reachable points using BFS.
    
    Returns:
        Dict mapping target_index -> distance from start
        Index formula: index = y * cols + x
    """
    distances = {}
    start_index = start_y * cols + start_x
    distances[start_index] = 0
    
    queue = deque([(start_y, start_x, 0)])
    visited = {(start_y, start_x)}
    
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]  # right, left, down, up
    
    while queue:
        y, x, dist = queue.popleft()
        
        for dy, dx in directions:
            ny, nx = y + dy, x + dx
            
            if 0 <= ny < rows and 0 <= nx < cols:
                if grid[ny][nx] not in UNWALKABLE_SYMBOLS and (ny, nx) not in visited:
                    visited.add((ny, nx))
                    target_index = ny * cols + nx
                    distances[target_index] = dist + 1
                    queue.append((ny, nx, dist + 1))
    
    return distances


def calculate_full_grid_distances():
    """Calculate distance matrix for ALL grid cells (walkable and walls)."""
    
    # Load store layout
    layout_file_path = os.path.join(os.path.dirname(__file__), "..", "store_layout.json")
    with open(layout_file_path, "r") as f:
        layout = json.load(f)
    
    grid = layout["grid"]
    rows = len(grid)
    cols = len(grid[0])
    total_cells = rows * cols
    
    print(f"Grid size: {cols} cols x {rows} rows = {total_cells} total cells")
    
    # Initialize distance matrix with -1 (unreachable)
    # distances[i][j] = distance from cell_i to cell_j
    distances = [[-1] * total_cells for _ in range(total_cells)]
    
    # Calculate distances from each walkable cell
    walkable_count = 0
    for y in range(rows):
        for x in range(cols):
            if grid[y][x] not in UNWALKABLE_SYMBOLS:
                walkable_count += 1 # Counting how many cells are walkable
                source_index = y * cols + x
                
                # BFS from this point gives distances to ALL reachable points
                bfs_distances = bfs_from_point(grid, y, x, rows, cols)
                
                for target_index, dist in bfs_distances.items():
                    distances[source_index][target_index] = dist
        
        # Progress indicator
        if (y + 1) % 3 == 0:
            print(f"Processed row {y + 1}/{rows}...")
    
    print(f"\nWalkable cells: {walkable_count}")
    print(f"Matrix size: {total_cells} x {total_cells} = {total_cells * total_cells} entries")
    
    # Save to JSON
    output = {
        "rows": rows,
        "cols": cols,
        "distances": distances
    }
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "grid_distance_matrix.json")
    with open(output_path, "w") as f:
        json.dump(output, f)
    
    print(f"\n[SUCCESS] Saved to grid_distance_matrix.json")
    print(f"  File contains {rows}x{cols} grid info and {total_cells}x{total_cells} distance matrix")
    print(f"\nUsage: index = y * {cols} + x")
    print(f"  Example: cell (5, 10) -> index = 5 * {cols} + 10 = {5 * cols + 10}")


if __name__ == "__main__":
    calculate_full_grid_distances()

