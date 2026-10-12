import random
import math
import pandas as pd

random.seed(42)  # same data every run, so results are reproducible

TOPICS = [
    "Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window",
    "Stack", "Queue", "Linked List", "Binary Search", "Sorting",
    "Greedy", "Recursion", "Backtracking", "Trees", "Binary Search Tree",
    "Heap", "Graphs", "Dynamic Programming", "Bit Manipulation", "Math",
]
DIFFICULTY_RATING = {"EASY": 1200, "MEDIUM": 1600, "HARD": 2000}
BASE_SOLVE_TIME = {"EASY": 400, "MEDIUM": 900, "HARD": 1800}  # seconds

NUM_PLAYERS = 200
NUM_PROBLEMS = 60
ATTEMPTS_PER_PLAYER = 30


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


# 1. Fake problems
problems = []
for i in range(NUM_PROBLEMS):
    difficulty = random.choices(["EASY", "MEDIUM", "HARD"], weights=[3, 5, 2])[0]
    true_difficulty = DIFFICULTY_RATING[difficulty] + random.gauss(0, 100)
    problems.append({
        "problemId": f"p{i}",
        "difficulty": difficulty,
        "topic": random.choice(TOPICS),
        "trueDifficulty": true_difficulty,
    })

# 2. Fake players: overall skill plus a strength/weakness per topic
players = []
for i in range(NUM_PLAYERS):
    players.append({
        "userId": f"u{i}",
        "skill": random.gauss(1500, 250),
        "topicOffset": {t: random.gauss(0, 150) for t in TOPICS},
    })

# 3. Simulate attempts
rows = []
solved_count = {p["problemId"]: 0 for p in problems}
attempt_count = {p["problemId"]: 0 for p in problems}

for player in players:
    for match_index in range(1, ATTEMPTS_PER_PLAYER + 1):
        problem = random.choice(problems)
        effective_skill = player["skill"] + player["topicOffset"][problem["topic"]]
        p_solve = sigmoid((effective_skill - problem["trueDifficulty"]) / 200)
        accepted = random.random() < p_solve

        solve_time = None
        if accepted:
            speed_factor = 1 - (player["skill"] - 1500) / 3000  # stronger = faster
            solve_time = int(BASE_SOLVE_TIME[problem["difficulty"]] * speed_factor * random.uniform(0.6, 1.4))

        attempt_count[problem["problemId"]] += 1
        solved_count[problem["problemId"]] += int(accepted)

        rows.append({
            "userId": player["userId"],
            "problemId": problem["problemId"],
            "difficulty": problem["difficulty"],
            "topic": problem["topic"],
            "accepted": accepted,
            "solveTimeSec": solve_time,
            "matchIndex": match_index,
        })

# 4. Save submissions and problems (with computed acceptance rate)
submissions_df = pd.DataFrame(rows)
problems_df = pd.DataFrame(problems)
problems_df["acceptanceRate"] = problems_df["problemId"].map(
    lambda pid: solved_count[pid] / max(attempt_count[pid], 1)
)
problems_df = problems_df.drop(columns=["trueDifficulty"])  # model must not see this

import os
os.makedirs("data", exist_ok=True)
submissions_df.to_csv("data/synthetic_submissions.csv", index=False)
problems_df.to_csv("data/synthetic_problems.csv", index=False)

print(f"Saved {len(submissions_df)} submissions and {len(problems_df)} problems")
print(f"Overall accept rate: {submissions_df['accepted'].mean():.2f}")