import os
import joblib
from models.solve_probability import predict as predict_solve

MODEL_PATH = os.path.join(os.path.dirname(__file__), "match_model.joblib")
_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

FEATURES = ["rating_diff", "acc_easy", "acc_medium", "acc_hard", "acc_topic",
            "recent_10", "recent_50", "avg_time", "p_solve_diff"]


def _player_stats(sv, topic, difficulty):
    ad = sv.get("accuracy_by_difficulty", {})
    return {
        "acc_easy": ad.get("EASY", 0.5),
        "acc_medium": ad.get("MEDIUM", 0.5),
        "acc_hard": ad.get("HARD", 0.5),
        "acc_topic": sv.get("accuracy_by_topic", {}).get(topic, 0.5),
        "recent_10": sv.get("recent_10_accuracy", 0.5),
        "recent_50": sv.get("recent_50_accuracy", 0.5),
        "avg_time": sv.get("avg_solve_time_by_difficulty", {}).get(difficulty, 0) / 100,
    }


def build_features(a, b, problem):
    """a, b = {"rating": float, "skillVector": dict}. Returns the feature list (A minus B)."""
    topic = problem.get("topic", "Arrays")
    diff = problem["difficulty"]
    fa = _player_stats(a.get("skillVector") or {}, topic, diff)
    fb = _player_stats(b.get("skillVector") or {}, topic, diff)
    pa, _ = predict_solve(a, problem)
    pb, _ = predict_solve(b, problem)
    row = {"rating_diff": (a["rating"] - b["rating"]) / 100,
           "p_solve_diff": pa - pb}
    for k in fa:
        row[k] = fa[k] - fb[k]
    return [row[f] for f in FEATURES]


def predict(a, b, problem):
    if _model is None:
        p = 1 / (1 + 10 ** (-(a["rating"] - b["rating"]) / 400))  # Elo fallback
        return round(p, 3), "elo-fallback"
    x = [build_features(a, b, problem)]
    return round(float(_model.predict_proba(x)[0][1]), 3), "logistic"
