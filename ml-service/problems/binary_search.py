"""Binary Search. Input: {"nums": sorted distinct ints, "target": int}.
Output: index of target, or -1."""
import random
import numpy as np

EXAMPLES = [
    {"nums": [-1, 0, 3, 5, 9, 12], "target": 9},
    {"nums": [-1, 0, 3, 5, 9, 12], "target": 2},
]

MANDATORY = [
    {"nums": [5], "target": 5},                     # single element, found
    {"nums": [5], "target": -5},                    # single element, missing
    {"nums": [1, 3, 5, 7, 9], "target": 1},         # first element
    {"nums": [1, 3, 5, 7, 9], "target": 9},         # last element
    {"nums": [1, 3, 5, 7, 9], "target": 4},         # missing, between values
]


def reference(inp):
    nums, target = inp["nums"], inp["target"]
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


def gen_candidate():
    kind = random.choice(["small", "mid", "large", "negatives", "first", "last", "below", "above", "between"])
    n = random.randint(1, 15) if kind != "large" else random.randint(1000, 5000)
    lo_v, hi_v = (-10**4, 10**4) if kind in ("negatives", "large") else (0, 10**4)
    nums = sorted(random.sample(range(lo_v, hi_v), n))
    if kind == "first":
        target = nums[0]
    elif kind == "last":
        target = nums[-1]
    elif kind == "below":
        target = nums[0] - random.randint(1, 50)
    elif kind == "above":
        target = nums[-1] + random.randint(1, 50)
    elif kind == "between" and n > 1:
        gaps = [i for i in range(n - 1) if nums[i + 1] - nums[i] > 1]
        if not gaps:
            return None
        i = random.choice(gaps)
        target = nums[i] + 1
    else:
        target = random.choice(nums) if random.random() < 0.6 else random.randint(lo_v, hi_v)
    return {"nums": nums, "target": target}


def features(inp):
    nums, target = inp["nums"], inp["target"]
    n = len(nums)
    idx = reference(inp)
    return [
        np.log1p(n), nums[0], nums[-1], target,
        1.0 if idx >= 0 else 0.0,                    # found?
        (idx / n) if idx >= 0 else -0.5,             # relative position when found
        1.0 if target < nums[0] else 0.0,            # below the whole range
        1.0 if target > nums[-1] else 0.0,           # above the whole range
        sum(x < 0 for x in nums) / n,
    ]
