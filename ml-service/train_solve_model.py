import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, log_loss

from models.skill_vector import compute_skill_vector

TOPICS = [
    "Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window",
    "Stack", "Queue", "Linked List", "Binary Search", "Sorting",
    "Greedy", "Recursion", "Backtracking", "Trees", "Binary Search Tree",
    "Heap", "Graphs", "Dynamic Programming", "Bit Manipulation", "Math",
]
DIFF = {"EASY": 0, "MEDIUM": 1, "HARD": 2}

subs = pd.read_csv("data/synthetic_submissions.csv")
probs = pd.read_csv("data/synthetic_problems.csv").set_index("problemId")

rows = []
for user, g in subs.sort_values(["userId", "matchIndex"]).groupby("userId"):
    records = g.to_dict("records")
    for i, cur in enumerate(records):
        prior = records[:i]  # only attempts BEFORE this one
        sv = compute_skill_vector(user, prior)
        prob = probs.loc[cur["problemId"]]

        rows.append({
            "userId": user,
            # player features (from skill vector)
            "acc_easy": sv["accuracy_by_difficulty"].get("EASY", 0.5),
            "acc_medium": sv["accuracy_by_difficulty"].get("MEDIUM", 0.5),
            "acc_hard": sv["accuracy_by_difficulty"].get("HARD", 0.5),
            "acc_this_topic": sv["accuracy_by_topic"].get(cur["topic"], 0.5),
            "avg_time_this_diff": sv["avg_solve_time_by_difficulty"].get(cur["difficulty"], np.nan),
            "recent_10_acc": sv["recent_10_accuracy"],
            "recent_50_acc": sv["recent_50_accuracy"],
            "recent_delta": sv["recent_delta"],
            "time_consistency": sv["solve_time_consistency"],
            "n_prior_attempts": len(prior),
            # problem features
            "difficulty": DIFF[cur["difficulty"]],
            "topic": TOPICS.index(cur["topic"]),
            "acceptance_rate": prob["acceptanceRate"],
            # label
            "label": int(cur["accepted"]),
        })

df = pd.DataFrame(rows)
print(f"Training table: {df.shape[0]} rows, {df['label'].mean():.2f} solved")

FEATURES = [c for c in df.columns if c not in ("userId", "label")]

# Split by PLAYER so the test set contains players the model never saw
splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(splitter.split(df, groups=df["userId"]))
train, test = df.iloc[train_idx], df.iloc[test_idx]

model = lgb.LGBMClassifier(
    n_estimators=300, learning_rate=0.05, num_leaves=15,
    min_child_samples=30, random_state=42, verbose=-1,
)
model.fit(
    train[FEATURES], train["label"],
    eval_set=[(test[FEATURES], test["label"])],
    categorical_feature=["topic"],
    callbacks=[lgb.early_stopping(30, verbose=False)],
)

pred = model.predict_proba(test[FEATURES])[:, 1]
base = np.full(len(test), train["label"].mean())
print(f"AUC:      {roc_auc_score(test['label'], pred):.3f}")
print(f"Log-loss: {log_loss(test['label'], pred):.3f}  (always-guess-average baseline: {log_loss(test['label'], base):.3f})")

importance = sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1])
print("Top features:", importance[:5])

model.booster_.save_model("models/solve_model.txt")
print("Saved models/solve_model.txt")