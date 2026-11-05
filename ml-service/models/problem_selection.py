"""Competitive problem selection (PRD section 4.8).

Given two players and a pool of candidate problems, pick the problem that makes the
best battle: both players have a reasonable chance of solving it, the chances are
close to each other, and the duel itself is competitive.

Uses:
  Model 2 (solve probability)  -> P(A solves), P(B solves) for every candidate
  Model 4 (match outcome)      -> P(A wins) for every candidate
Both models already fall back to heuristics when no trained model / skill vector
exists, so this function always works.
"""
import random

from models.solve_probability import predict as predict_solve
from models.match_outcome import predict as predict_match

# Acceptable solve-probability band, tried in order until some candidates qualify.
# The first band is the PRD's 40%-70%; the later ones are graceful fallbacks.
BANDS = [(0.40, 0.70), (0.30, 0.80), (0.20, 0.90)]
BAND_CENTER = 0.55

# Score weights (sum to 1). Fairness matters most, then solvability, then the duel.
W_FAIRNESS = 0.40       # both players have a similar chance of solving
W_SOLVABILITY = 0.25    # the average chance is close to the middle of the band
W_COMPETITIVE = 0.25    # Model 4 says the duel is close to 50/50
W_TOPIC = 0.10          # problem matches a preferred topic of either player

EXPLORATION = 0.15      # chance of picking randomly among viable problems (variety)


def _score(pa, pb, p_a_wins, topic_match):
    fairness = 1 - abs(pa - pb)
    solvability = 1 - abs((pa + pb) / 2 - BAND_CENTER) / BAND_CENTER
    competitive = 1 - 2 * abs(p_a_wins - 0.5)
    return (W_FAIRNESS * fairness
            + W_SOLVABILITY * max(solvability, 0)
            + W_COMPETITIVE * competitive
            + W_TOPIC * (1.0 if topic_match else 0.0))


def select_problem(player_a, player_b, candidates, exclude_ids=None, seed=None,
                   exploration=EXPLORATION):
    """player_*: {"rating", "skillVector", "preferredTopics": [..]}
    candidates: [{"problemId", "difficulty", "topic", "acceptanceRate"}, ...]
    Returns a dict, or {"problem": None, ...} if nothing is available."""
    exclude = set(exclude_ids or [])
    pool = [c for c in candidates if c.get("problemId") not in exclude]
    if not pool:
        return {"problem": None, "reason": "no candidate problems available"}

    preferred = set(player_a.get("preferredTopics") or []) | set(player_b.get("preferredTopics") or [])

    scored = []
    for c in pool:
        pa, src_a = predict_solve(player_a, c)
        pb, src_b = predict_solve(player_b, c)
        p_a_wins, src_m = predict_match(player_a, player_b, c)
        topic_match = c.get("topic") in preferred
        scored.append({
            "problem": c, "pA": pa, "pB": pb, "pAWins": p_a_wins,
            "topicMatch": topic_match,
            "score": _score(pa, pb, p_a_wins, topic_match),
            "sources": {"solve": src_a if src_a == src_b else f"{src_a}/{src_b}", "match": src_m},
        })

    # Keep only problems where BOTH players are inside the band; widen if none qualify.
    viable, band_used = [], None
    for lo, hi in BANDS:
        viable = [s for s in scored if lo <= s["pA"] <= hi and lo <= s["pB"] <= hi]
        if viable:
            band_used = (lo, hi)
            break

    relaxed = band_used != BANDS[0]
    if not viable:
        # Nothing is in any band (e.g. a huge skill gap): take the best-scoring candidate anyway.
        viable, band_used, relaxed = scored, None, True

    viable.sort(key=lambda s: -s["score"])
    rng = random.Random(seed)
    explored = len(viable) > 1 and rng.random() < exploration
    chosen = rng.choice(viable) if explored else viable[0]

    return {
        "problem": chosen["problem"],
        "predictions": {"pASolves": chosen["pA"], "pBSolves": chosen["pB"], "pAWins": chosen["pAWins"]},
        "score": round(chosen["score"], 3),
        "topicMatch": chosen["topicMatch"],
        "band": list(band_used) if band_used else None,
        "bandRelaxed": relaxed,
        "explored": explored,
        "candidatesConsidered": len(pool),
        "candidatesInBand": len(viable) if band_used else 0,
        "sources": chosen["sources"],
    }
