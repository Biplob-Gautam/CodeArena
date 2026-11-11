import os
import math
import numpy as np
import lightgbm as lgb

TOPICS = [
    "Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window",
    "Stack", "Queue", "Linked List", "Binary Search", "Sorting",
    "Greedy", "Recursion", "Backtracking", "Trees", "Binary Search Tree",
    "Heap", "Graphs", "Dynamic Programming", "Bit Manipulation", "Math",
]
DIFF = {"EASY": 0, "MEDIUM": 1, "HARD": 2}
MODEL_PATH = os.path.join(os.path.dirname(__file__), "solve_model.txt")

_booster = lgb.Booster(model_file=MODEL_PATH) if os.path.exists(MODEL_PATH) else None


def heuristic(player_rating, difficulty, acceptance_rate):
    base = {"EASY": 1300, "MEDIUM": 1600, "HARD": 1900}.get(difficulty, 1600)
    rating_part = 1 / (1 + math.exp(-(player_rating - base) / 200))
    return round(0.5 * rating_part + 0.5 * acceptance_rate, 3)


def predict(player, problem):
    sv = player.get("skillVector") or {}
    difficulty = problem["difficulty"]
    acceptance = problem.get("acceptanceRate", 0.5)

    # Fallback: no trained model, or no skill vector sent
    if _booster is None or not sv:
        return heuristic(player.get("rating", 1500), difficulty, acceptance), "heuristic"

    topic = problem.get("topic", "Arrays")
    acc_d = sv.get("accuracy_by_difficulty", {})
    row = [
        acc_d.get("EASY", 0.5),
        acc_d.get("MEDIUM", 0.5),
        acc_d.get("HARD", 0.5),
        sv.get("accuracy_by_topic", {}).get(topic, 0.5),
        sv.get("avg_solve_time_by_difficulty", {}).get(difficulty, np.nan),
        sv.get("recent_10_accuracy", 0.5),
        sv.get("recent_50_accuracy", 0.5),
        sv.get("recent_delta", 0.0),
        sv.get("solve_time_consistency", 0.0),
        sv.get("n_prior_attempts", 0),
        DIFF[difficulty],
        TOPICS.index(topic) if topic in TOPICS else 0,
        acceptance,
    ]
    p = _booster.predict(np.array([row], dtype=float))[0]
    return round(float(p), 3), "lightgbm"