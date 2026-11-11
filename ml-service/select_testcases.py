"""Offline test-suite builder (runs once per problem, never during a battle).

Usage:
    python select_testcases.py max_subarray
    python select_testcases.py two_sum binary_search
    python select_testcases.py all

Pipeline per problem:
    candidates (problem's generator) -> features -> scale -> K-Means
    -> closest-to-centroid representatives
    + problem's EXAMPLES (visible) + MANDATORY edge cases
    -> expected outputs from the problem's trusted reference solution
    -> testsuites/<problem>.json
"""
import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import sys
import json
import random
import importlib

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

import problems

TARGET_CASES = 14      # total suite size (PRD: roughly 10-15)
N_CANDIDATES = 400     # candidate pool size per problem
SEED = 1


def key(x):
    return json.dumps(x, sort_keys=True)


def build_suite(mod):
    random.seed(SEED)

    # 1) fixed cases: visible examples first, then mandatory edge cases
    ordered, seen = [], set()
    for x in list(mod.EXAMPLES) + list(mod.MANDATORY):
        if key(x) not in seen:
            seen.add(key(x))
            ordered.append(x)
    n_visible = len(mod.EXAMPLES)

    # 2) candidate pool
    cands, cand_seen, attempts = [], set(), 0
    while len(cands) < N_CANDIDATES and attempts < N_CANDIDATES * 30:
        attempts += 1
        c = mod.gen_candidate()
        if c is None or key(c) in cand_seen or key(c) in seen:
            continue
        cand_seen.add(key(c))
        cands.append(c)

    # 3) K-Means: one representative per cluster
    k = min(TARGET_CASES - len(ordered), len(cands))
    sizes = []
    if k > 0:
        X = StandardScaler().fit_transform(np.array([mod.features(c) for c in cands], dtype=float))
        km = KMeans(n_clusters=k, n_init=10, random_state=SEED).fit(X)
        sizes = np.bincount(km.labels_).tolist()
        for cl in range(k):
            members = np.where(km.labels_ == cl)[0]
            dists = np.linalg.norm(X[members] - km.cluster_centers_[cl], axis=1)
            for m in members[np.argsort(dists)]:
                if key(cands[m]) not in seen:          # closest member not already in the suite
                    seen.add(key(cands[m]))
                    ordered.append(cands[m])
                    break

    cases = [{"input": x, "expected": mod.reference(x), "visible": i < n_visible}
             for i, x in enumerate(ordered)]
    return cases, sizes, len(mod.MANDATORY)


def main(names):
    os.makedirs("testsuites", exist_ok=True)
    for name in names:
        mod = importlib.import_module(f"problems.{name}")
        cases, sizes, n_mand = build_suite(mod)
        with open(f"testsuites/{name}.json", "w") as f:
            json.dump(cases, f)
        n_vis = sum(c["visible"] for c in cases)
        distinct = len({key(c["expected"]) for c in cases})
        print(f"{name:20s} {len(cases)} cases ({n_vis} visible, {len(cases) - n_vis} hidden) | "
              f"{n_mand} mandatory | {len(sizes)} clusters {sizes} | {distinct} distinct expected outputs")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit("Usage: python select_testcases.py <problem> [<problem> ...] | all\n"
                 "Problems: " + ", ".join(problems.ALL))
    main(problems.ALL if args == ["all"] else args)
