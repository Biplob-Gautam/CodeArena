# CodeArena ML Service

Python (FastAPI) service that answers prediction questions for the NestJS backend.
The backend sends features over HTTP and gets structured predictions back.

## Run

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Interactive docs: http://127.0.0.1:8000/docs

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service health check |
| GET | `/skill-vector/{userId}` | Player skill vector (currently built from fake data) |
| POST | `/predict/solve-probability` | Model 2 (LightGBM): P(player solves problem) |
| POST | `/predict/match-outcome` | Model 4 (logistic regression): P(A beats B) |
| POST | `/select-problem` | Picks the best problem for a matched pair |
| POST | `/insights` | Profile analytics (strongest/weakest topics, trends, performance vs expectation) |

A *player* is `{"rating": 1650, "skillVector": {...}, "preferredTopics": ["Graphs"]}`.
`skillVector` may be `{}` (new player): the service then falls back to heuristics.
A *problem* is `{"problemId": "p1", "difficulty": "EASY|MEDIUM|HARD", "topic": "Graphs", "acceptanceRate": 0.5}`.

**POST /predict/solve-probability**
`{"player": {...}, "problem": {...}}` returns `{"solveProbability": 0.67, "source": "lightgbm" | "heuristic"}`

**POST /predict/match-outcome**
`{"playerA": {...}, "playerB": {...}, "problem": {...}}` returns `{"pAWins": 0.75, "pBWins": 0.25, "source": "logistic" | "elo-fallback"}`

**POST /select-problem**
`{"playerA": {...}, "playerB": {...}, "candidates": [problem, ...], "excludeProblemIds": [], "seed": null}`
returns the chosen `problem`, its `predictions`, and `band` / `bandRelaxed` / `explored` diagnostics.
Returns `{"problem": null}` when no candidate is available.

**POST /insights**
The backend sends the player's history; this service stores nothing.
```json
{
  "submissions": [{"difficulty": "EASY|MEDIUM|HARD", "topic": "Graphs", "accepted": true, "solveTimeSec": 240, "matchIndex": 1}],
  "matches": [{"matchIndex": 1, "result": "WIN|LOSS|DRAW", "ratingAfter": 1523, "problemTitle": "Two Sum", "predictedWinProb": 0.48}]
}
```
`matches` is optional (needed for record, rating graph and "performance vs expectation").
`predictedWinProb` is Model 4's pre-match P(win): the backend must **store it when the match starts**.
Returns accuracy per difficulty/topic, strongest/weakest topic, recent-10 vs recent-50 trend,
improving/declining topics, solve-time consistency, W/L/D record, `ratingHistory` (for the line graph,
each point has the rating and the problem), and `messages` (ready-to-show sentences).
Fewer than 5 battles returns `"ready": false` with a "play N more matches" message.

Glicko-2 stays the primary matchmaking signal. These models only refine the choice.
If a model file is missing, every endpoint still answers using heuristics.

## Offline scripts (not called during battles)

| Script | What it does |
|---|---|
| `generate_synthetic.py` | Makes fake players/problems/submissions in `data/` (for development only) |
| `train_solve_model.py` | Trains Model 2, writes `models/solve_model.txt` |
| `train_match_model.py` | Trains Model 4, writes `models/match_model.joblib` |
| `select_testcases.py all` | K-Means test-suite builder, writes `testsuites/<problem>.json` |

Test-suite inputs: Max Subarray = list of ints; Two Sum / Binary Search = `{"nums": [...], "target": n}`;
Valid Parentheses and Longest Substring = string; Number of Islands = list of row strings of `0`/`1`.

## Important

All models are currently trained on **synthetic data**. Metrics from it only show that the
pipeline works. Retrain on real match data before trusting any number.
