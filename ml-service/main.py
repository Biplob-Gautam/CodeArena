import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
from fastapi import FastAPI
from models.skill_vector import compute_skill_vector, fake_submissions
from models.solve_probability import predict as predict_solve
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
    return {"pAWins": 0.5, "pBWins": 0.5}
@app.get("/skill-vector/{user_id}")
def skill_vector(user_id: str):
    return compute_skill_vector(user_id, fake_submissions)