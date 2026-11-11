"""Maximum Subarray. Input: list of ints. Output: int (largest contiguous sum)."""
import random
import numpy as np

EXAMPLES = [
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    [5, 4, -1, 7, 8],
]

MANDATORY = [
    [5],                 # single element
    [-3],                # single negative
    [-1, -2, -3],        # all negative (answer is the max element, not 0)
    [0, 0, 0],           # all zeros
    [1, 2, 3, 4, 5],     # all positive (whole array)
]


def reference(nums):  # Kadane
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best


def gen_candidate():
    kind = random.choice(["random", "sorted", "reverse", "dups", "neg", "pos", "zeros", "large"])
    n = random.randint(2, 20) if kind != "large" else random.randint(1000, 5000)
    if kind == "random":
        return [random.randint(-100, 100) for _ in range(n)]
    if kind == "sorted":
        return sorted(random.randint(-100, 100) for _ in range(n))
    if kind == "reverse":
        return sorted((random.randint(-100, 100) for _ in range(n)), reverse=True)
    if kind == "dups":
        return [random.choice([-2, 0, 3]) for _ in range(n)]
    if kind == "neg":
        return [random.randint(-100, -1) for _ in range(n)]
    if kind == "pos":
        return [random.randint(1, 100) for _ in range(n)]
    if kind == "zeros":
        return [random.choice([0, 0, 0, 1, -1]) for _ in range(n)]
    return [random.randint(-10000, 10000) for _ in range(n)]


def features(a):
    n = len(a)
    asc = 1.0 if n == 1 else sum(a[i] <= a[i + 1] for i in range(n - 1)) / (n - 1)
    return [
        np.log1p(n), min(a), max(a),
        1 - len(set(a)) / n,           # duplicate ratio
        asc,                            # sortedness (1 = ascending, 0 = descending)
        sum(x < 0 for x in a) / n,      # negative ratio
        sum(x == 0 for x in a) / n,     # zero ratio
    ]
