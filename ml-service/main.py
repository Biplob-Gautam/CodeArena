import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

from fastapi import FastAPI
from models.skill_vector import compute_skill_vector, fake_submissions
from models.solve_probability import predict as predict_solve
from models.match_outcome import predict as predict_match

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict/solve-probability")
def solve_probability(payload: dict):
    p, source = predict_solve(payload["player"], payload["problem"])
    return {"solveProbability": p, "source": source}


@app.post("/predict/match-outcome")
def match_outcome(payload: dict):
    pa, source = predict_match(payload["playerA"], payload["playerB"], payload["problem"])
    return {"pAWins": pa, "pBWins": round(1 - pa, 3), "source": source}


@app.get("/skill-vector/{user_id}")
def skill_vector(user_id: str):
    return compute_skill_vector(user_id, fake_submissions)
