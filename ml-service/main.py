from fastapi import FastAPI
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