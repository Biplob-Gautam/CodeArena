import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import math, random
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, log_loss, accuracy_score

from models.skill_vector import compute_skill_vector
from models.match_outcome import build_features, FEATURES

random.seed(7)
TOPICS = ["Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window", "Stack",
          "Queue", "Linked List", "Binary Search", "Sorting", "Greedy", "Recursion",
          "Backtracking", "Trees", "Binary Search Tree", "Heap", "Graphs",
          "Dynamic Programming", "Bit Manipulation", "Math"]
DIFF_RATING = {"EASY": 1200, "MEDIUM": 1600, "HARD": 2000}
BASE_TIME = {"EASY": 400, "MEDIUM": 900, "HARD": 1800}
NUM_PLAYERS, ROUNDS, K = 200, 30, 32


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


problems = []
for i in range(60):
    d = random.choices(["EASY", "MEDIUM", "HARD"], weights=[3, 5, 2])[0]
    td = DIFF_RATING[d] + random.gauss(0, 100)
    problems.append({"difficulty": d, "topic": random.choice(TOPICS), "trueDifficulty": td,
                     "acceptanceRate": round(sigmoid((1500 - td) / 300), 3)})

players = [{"id": f"u{i}", "skill": random.gauss(1500, 250), "rating": 1500.0, "history": [],
            "offset": {t: random.gauss(0, 150) for t in TOPICS}} for i in range(NUM_PLAYERS)]


def view(p):
    sv = compute_skill_vector(p["id"], p["history"])
    sv["n_prior_attempts"] = len(p["history"])
    return {"rating": p["rating"], "skillVector": sv}


def attempt(p, prob):
    eff = p["skill"] + p["offset"][prob["topic"]]
    ok = random.random() < sigmoid((eff - prob["trueDifficulty"]) / 200)
    t = None
    if ok:
        t = int(BASE_TIME[prob["difficulty"]] * (1 - (p["skill"] - 1500) / 3000) * random.uniform(0.6, 1.4))
    return ok, t


X, y, rnd = [], [], []
for r in range(ROUNDS):
    order = random.sample(players, len(players))
    for a, b in zip(order[0::2], order[1::2]):
        prob = random.choice(problems)
        pub = {k: prob[k] for k in ("difficulty", "topic", "acceptanceRate")}
        feats = build_features(view(a), view(b), pub)  # built from PRIOR history only

        (oka, ta), (okb, tb) = attempt(a, prob), attempt(b, prob)
        if oka and okb:
            score_a = 1.0 if ta <= tb else 0.0
        elif oka:
            score_a = 1.0
        elif okb:
            score_a = 0.0
        else:
            score_a = 0.5  # draw

        if score_a != 0.5:  # draws excluded from training
            X.append(feats); y.append(int(score_a)); rnd.append(r)

        exp_a = 1 / (1 + 10 ** (-(a["rating"] - b["rating"]) / 400))
        a["rating"] += K * (score_a - exp_a)
        b["rating"] += K * ((1 - score_a) - (1 - exp_a))
        for p, ok, t in ((a, oka, ta), (b, okb, tb)):
            p["history"].append({"userId": p["id"], "difficulty": prob["difficulty"], "topic": prob["topic"],
                                 "accepted": ok, "solveTimeSec": t, "matchIndex": len(p["history"]) + 1})

X, y, rnd = np.array(X), np.array(y), np.array(rnd)
print(f"{len(y)} decisive matches, A-win rate {y.mean():.2f}")

split = rnd < int(ROUNDS * 0.8)  # train on early rounds, test on later ones
model = make_pipeline(StandardScaler(with_mean=False), LogisticRegression(fit_intercept=False, C=1.0))
model.fit(X[split], y[split])

p = model.predict_proba(X[~split])[:, 1]
print(f"AUC:      {roc_auc_score(y[~split], p):.3f}")
print(f"Log-loss: {log_loss(y[~split], p):.3f}  (coin-flip baseline: 0.693)")
print(f"Accuracy: {accuracy_score(y[~split], p > 0.5):.3f}")
coefs = model[-1].coef_[0]
for f, c in sorted(zip(FEATURES, coefs), key=lambda t: -abs(t[1])):
    print(f"  {f:14s} {c:+.3f}")

joblib.dump(model, "models/match_model.joblib")
print("Saved models/match_model.joblib")
