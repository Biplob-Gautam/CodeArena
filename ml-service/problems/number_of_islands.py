"""Number of Islands. Input: grid as a list of row strings made of '0' (water) and '1' (land).
Output: int (number of 4-connected land groups)."""
import random
import numpy as np

EXAMPLES = [
    ["11110", "11010", "11000", "00000"],
    ["11000", "11000", "00100", "00011"],
]

MANDATORY = [
    ["1"],                        # 1x1 land
    ["0"],                        # 1x1 water
    ["1111"],                     # single row
    ["1", "0", "1"],              # single column, two islands
    ["101", "010", "101"],        # checkerboard: diagonals do NOT connect
    ["000", "000"],               # all water
]


def _islands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    count, largest = 0, 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and not seen[r][c]:
                count += 1
                size = 0
                stack = [(r, c)]
                seen[r][c] = True
                while stack:
                    y, x = stack.pop()
                    size += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < rows and 0 <= nx < cols and grid[ny][nx] == "1" and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((ny, nx))
                largest = max(largest, size)
    return count, largest


def reference(grid):
    return _islands(grid)[0]


def gen_candidate():
    kind = random.choice(["sparse", "medium", "dense", "row", "col", "checker", "water", "land", "large"])
    if kind == "row":
        rows, cols = 1, random.randint(2, 12)
    elif kind == "col":
        rows, cols = random.randint(2, 12), 1
    elif kind == "large":
        rows, cols = random.randint(40, 120), random.randint(40, 120)
    else:
        rows, cols = random.randint(2, 8), random.randint(2, 8)
    if kind == "checker":
        grid = ["".join("1" if (r + c) % 2 == 0 else "0" for c in range(cols)) for r in range(rows)]
    elif kind == "water":
        grid = ["0" * cols for _ in range(rows)]
    elif kind == "land":
        grid = ["1" * cols for _ in range(rows)]
    else:
        p = {"sparse": 0.2, "medium": 0.5, "dense": 0.8, "row": 0.5, "col": 0.5, "large": random.choice([0.3, 0.5, 0.6])}[kind]
        grid = ["".join("1" if random.random() < p else "0" for _ in range(cols)) for _ in range(rows)]
    return grid


def features(grid):
    rows, cols = len(grid), len(grid[0])
    cells = rows * cols
    count, largest = _islands(grid)
    land = sum(row.count("1") for row in grid)
    return [
        np.log1p(cells),
        rows / cols,                 # shape (tall vs wide)
        land / cells,                # density
        np.log1p(count),             # number of islands
        largest / cells,             # share taken by the biggest island
        count / max(land, 1),        # fragmentation: islands per land cell
    ]
