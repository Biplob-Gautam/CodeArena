"""Two Sum. Input: {"nums": [...], "target": int} with exactly ONE valid pair.
Output: the two indices, sorted ascending (so the judge has one unambiguous answer)."""
import random
from collections import Counter
import numpy as np

EXAMPLES = [
    {"nums": [2, 7, 11, 15], "target": 9},
    {"nums": [3, 2, 4], "target": 6},
]

MANDATORY = [
    {"nums": [3, 3], "target": 6},                    # duplicate values form the pair
    {"nums": [0, 4, 3, 0], "target": 0},              # zeros, target zero
    {"nums": [-3, 4, 3, 90], "target": 0},            # negative + positive cancel
    {"nums": [-1, -2, -3, -4, -5], "target": -8},     # all negative
    {"nums": [1, 2], "target": 3},                    # minimum size
]


def _pair_count(nums, target):
    c = Counter(nums)
    total = 0
    for v in c:
        w = target - v
        if v < w and w in c:
            total += c[v] * c[w]
        elif v == w:
            total += c[v] * (c[v] - 1) // 2
    return total


def reference(inp):
    nums, target = inp["nums"], inp["target"]
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return sorted([seen[target - x], i])
        seen[x] = i
    return None


def gen_candidate():
    kind = random.choice(["small", "negatives", "zeros", "dups", "large", "sorted", "edges"])
    for _ in range(200):
        n = random.randint(2, 12)
        if kind == "small":
            nums = [random.randint(0, 40) for _ in range(n)]
        elif kind == "negatives":
            nums = [random.randint(-50, 50) for _ in range(n)]
        elif kind == "zeros":
            nums = [random.choice([0, 0, 1, -1, 2]) for _ in range(n)]
        elif kind == "dups":
            n = random.randint(2, 5)
            nums = [random.choice([1, 2, 3]) for _ in range(n)]
        elif kind == "sorted":
            nums = sorted(random.randint(-30, 30) for _ in range(n))
        elif kind == "edges":
            nums = [random.randint(-10**9, 10**9) for _ in range(random.randint(2, 8))]
        else:  # large: wide value range keeps the pair unique
            nums = [random.randint(-10**9, 10**9) for _ in range(random.randint(500, 3000))]
        n = len(nums)
        i, j = random.sample(range(n), 2)
        target = nums[i] + nums[j]
        if _pair_count(nums, target) == 1:
            return {"nums": nums, "target": target}
    return None


def features(inp):
    nums, target = inp["nums"], inp["target"]
    n = len(nums)
    i, j = reference(inp)
    return [
        np.log1p(n), min(nums), max(nums), target,
        1 - len(set(nums)) / n,
        sum(x < 0 for x in nums) / n,
        sum(x == 0 for x in nums) / n,
        i / n,                 # where the first index of the answer sits
        (j - i) / n,           # how far apart the pair is
    ]
