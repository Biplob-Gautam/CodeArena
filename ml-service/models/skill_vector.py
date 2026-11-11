from collections import defaultdict
import statistics

# Fake submission data to develop against, until real data exists
fake_submissions = [
    {"userId": "u1", "difficulty": "EASY", "topic": "Arrays", "accepted": True, "solveTimeSec": 240, "matchIndex": 1},
    {"userId": "u1", "difficulty": "MEDIUM", "topic": "Graphs", "accepted": False, "solveTimeSec": None, "matchIndex": 2},
    {"userId": "u1", "difficulty": "EASY", "topic": "Strings", "accepted": True, "solveTimeSec": 180, "matchIndex": 3},
]

def compute_skill_vector(user_id, submissions):
    user_subs = [s for s in submissions if s["userId"] == user_id]

    if not user_subs:
        return {
            "accuracy_by_difficulty": {"EASY": 0.5, "MEDIUM": 0.5, "HARD": 0.5},
            "accuracy_by_topic": {},
            "avg_solve_time_by_difficulty": {},
            "recent_10_accuracy": 0.5,
            "recent_50_accuracy": 0.5,
            "recent_delta": 0.0,
            "solve_time_consistency": 0.0,
        }

    by_difficulty = defaultdict(list)
    for s in user_subs:
        by_difficulty[s["difficulty"]].append(s["accepted"])
    accuracy_by_difficulty = {
        diff: sum(results) / len(results) for diff, results in by_difficulty.items()
    }

    by_topic = defaultdict(list)
    for s in user_subs:
        by_topic[s["topic"]].append(s["accepted"])
    accuracy_by_topic = {
        topic: sum(results) / len(results) for topic, results in by_topic.items()
    }

    solve_times_by_difficulty = defaultdict(list)
    for s in user_subs:
        if s["accepted"] and s["solveTimeSec"]:
            solve_times_by_difficulty[s["difficulty"]].append(s["solveTimeSec"])
    avg_solve_time = {
        diff: statistics.mean(times) for diff, times in solve_times_by_difficulty.items() if times
    }

    sorted_subs = sorted(user_subs, key=lambda s: s["matchIndex"])
    recent_10 = sorted_subs[-10:]
    recent_50 = sorted_subs[-50:]
    recent_10_acc = sum(s["accepted"] for s in recent_10) / len(recent_10)
    recent_50_acc = sum(s["accepted"] for s in recent_50) / len(recent_50)

    all_times = [s["solveTimeSec"] for s in user_subs if s["accepted"] and s["solveTimeSec"]]
    consistency = statistics.pvariance(all_times) if len(all_times) > 1 else 0.0

    return {
        "accuracy_by_difficulty": accuracy_by_difficulty,
        "accuracy_by_topic": accuracy_by_topic,
        "avg_solve_time_by_difficulty": avg_solve_time,
        "recent_10_accuracy": recent_10_acc,
        "recent_50_accuracy": recent_50_acc,
        "recent_delta": recent_10_acc - recent_50_acc,
        "solve_time_consistency": consistency,
    }