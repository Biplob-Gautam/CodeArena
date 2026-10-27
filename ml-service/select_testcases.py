import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import json, random
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

random.seed(1)
K = 8  # cluster representatives; plus mandatory cases gives about 14 total


def reference(nums):  # Kadane: trusted solution used to compute expected output
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best


def gen_candidate():
    kind = random.choice(["random", "sorted", "reverse", "dups", "neg", "pos", "zeros", "large"])
    n = random.randint(2, 20) if kind != "large" else random.randint(1000, 5000)
    if kind == "random":   a = [random.randint(-100, 100) for _ in range(n)]
    elif kind == "sorted": a = sorted(random.randint(-100, 100) for _ in range(n))
    elif kind == "reverse": a = sorted((random.randint(-100, 100) for _ in range(n)), reverse=True)
    elif kind == "dups":   a = [random.choice([-2, 0, 3]) for _ in range(n)]
    elif kind == "neg":    a = [random.randint(-100, -1) for _ in range(n)]
    elif kind == "pos":    a = [random.randint(1, 100) for _ in range(n)]
    elif kind == "zeros":  a = [random.choice([0, 0, 0, 1, -1]) for _ in range(n)]
    else:                  a = [random.randint(-10000, 10000) for _ in range(n)]
    return a


def features(a):
    n = len(a)
    asc = 1.0 if n == 1 else sum(a[i] <= a[i + 1] for i in range(n - 1)) / (n - 1)
    return [
        np.log1p(n), min(a), max(a),
        1 - len(set(a)) / n,            # duplicate ratio
        asc,                             # sortedness (1 = ascending, 0 = descending)
        sum(x < 0 for x in a) / n,       # negative ratio
        sum(x == 0 for x in a) / n,      # zero ratio
    ]


MANDATORY = [
    [5], [-3], [-1, -2, -3], [0, 0, 0], [1, 2, 3, 4, 5],
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],        # classic example
]

candidates = [gen_candidate() for _ in range(300)]
X = StandardScaler().fit_transform(np.array([features(a) for a in candidates]))

km = KMeans(n_clusters=K, n_init=10, random_state=1).fit(X)
chosen = []
for c in range(K):
    members = np.where(km.labels_ == c)[0]
    dists = np.linalg.norm(X[members] - km.cluster_centers_[c], axis=1)
    chosen.append(candidates[members[dists.argmin()]])  # closest to centroid

suite = MANDATORY + [a for a in chosen if a not in MANDATORY]
cases = [{"input": a, "expected": reference(a), "visible": i < 2} for i, a in enumerate(suite)]

os.makedirs("testsuites", exist_ok=True)
with open("testsuites/max_subarray.json", "w") as f:
    json.dump(cases, f)
print(f"Saved {len(cases)} test cases (2 visible, {len(cases) - 2} hidden)")
print("Cluster sizes:", np.bincount(km.labels_).tolist())