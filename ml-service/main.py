from fastapi import FastAPI
from models.skill_vector import compute_skill_vector, fake_submissions
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict/solve-probability")
def solve_probability(payload: dict):
    return {"solveProbability": 0.5}

@app.post("/predict/match-outcome")
def match_outcome(payload: dict):
    return {"pAWins": 0.5, "pBWins": 0.5}
@app.get("/skill-vector/{user_id}")
def skill_vector(user_id: str):
    return compute_skill_vector(user_id, fake_submissions)