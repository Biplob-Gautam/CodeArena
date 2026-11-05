"""CodeArena Insights (PRD section 3.19).

Turns a player's history into explainable analytics for the profile page.
Everything here is plain statistics on real history: no fabricated numbers, and every
sentence in "messages" is generated from a number you can also read in the output.

Inputs (sent by the backend, which owns the database):
  submissions: [{"difficulty", "topic", "accepted", "solveTimeSec", "matchIndex"}, ...]
               one row per battle the player took part in (one problem per battle)
  matches:     optional, [{"matchIndex", "result": "WIN"|"LOSS"|"DRAW",
                           "ratingAfter", "problemTitle", "predictedWinProb"}, ...]
               "predictedWinProb" is Model 4's pre-match P(win), stored at match start.
"""
import statistics

MIN_ATTEMPTS_FOR_INSIGHTS = 5    # below this we only report counts, no conclusions
MIN_TOPIC_ATTEMPTS = 3           # topic must have this many attempts to be called strongest/weakest
MIN_TOPIC_TREND_ATTEMPTS = 8     # per-topic trend needs this many attempts
SMOOTHING = 2                    # pseudo-attempts pulling a topic toward the player's overall accuracy
TREND_THRESHOLD = 0.05           # recent-10 vs recent-50 gap that counts as a real change
TOPIC_TREND_THRESHOLD = 0.30     # second-half minus first-half accuracy that counts as a real change
EXPECTATION_WINDOW = 5           # matches per "performance vs expectation" window
EXPECTATION_THRESHOLD = 0.15     # actual - predicted win rate that counts as over/under-performing
CONSISTENT_CV = 0.35             # solve-time coefficient of variation below this = consistent


def _pct(x):
    return round(100 * x)


def _acc(rows):
    return sum(r["accepted"] for r in rows) / len(rows) if rows else None


def _group(rows, key):
    g = {}
    for r in rows:
        g.setdefault(r[key], []).append(r)
    return g


def _topic_trend(rows):
    """Accuracy in the latest half of a topic's battles minus accuracy in the earliest half.
    (A regression slope was tried first, but it flagged a steady alternating player as declining.)"""
    half = len(rows) // 2
    return _acc(rows[-half:]) - _acc(rows[:half])


def compute_insights(submissions, matches=None):
    subs = sorted(submissions, key=lambda s: s["matchIndex"])
    n = len(subs)
    out = {"attempts": n, "ready": n >= MIN_ATTEMPTS_FOR_INSIGHTS, "messages": []}
    msgs = out["messages"]

    if n == 0:
        msgs.append("No battles yet. Play your first match to start building your profile.")
        return out
    if not out["ready"]:
        msgs.append(f"Play {MIN_ATTEMPTS_FOR_INSIGHTS - n} more match(es) to unlock your insights.")

    overall = _acc(subs)
    out["overallAccuracy"] = round(overall, 3)

    # ---- difficulty performance + solve time -------------------------------------------
    by_diff = _group(subs, "difficulty")
    out["difficulty"] = {}
    for d in ("EASY", "MEDIUM", "HARD"):
        rows = by_diff.get(d, [])
        times = [r["solveTimeSec"] for r in rows if r["accepted"] and r.get("solveTimeSec")]
        out["difficulty"][d] = {
            "attempts": len(rows),
            "accuracy": round(_acc(rows), 3) if rows else None,
            "avgSolveTimeSec": round(statistics.mean(times)) if times else None,
        }

    # ---- topic performance (smoothed) --------------------------------------------------
    by_topic = _group(subs, "topic")
    topics = {}
    for t, rows in by_topic.items():
        solved = sum(r["accepted"] for r in rows)
        topics[t] = {
            "attempts": len(rows),
            "accuracy": round(solved / len(rows), 3),
            # shrunk toward overall accuracy so 1/1 does not look like a "100% topic"
            "smoothedAccuracy": round((solved + SMOOTHING * overall) / (len(rows) + SMOOTHING), 3),
        }
    out["topics"] = topics

    eligible = {t: v for t, v in topics.items() if v["attempts"] >= MIN_TOPIC_ATTEMPTS}
    out["strongestTopic"] = out["weakestTopic"] = None
    if out["ready"] and len(eligible) >= 2:
        ranked = sorted(eligible, key=lambda t: (-eligible[t]["smoothedAccuracy"], t))
        best, worst = ranked[0], ranked[-1]
        if eligible[best]["smoothedAccuracy"] > eligible[worst]["smoothedAccuracy"]:
            out["strongestTopic"], out["weakestTopic"] = best, worst
            msgs.append(f"Strongest topic: {best} ({_pct(eligible[best]['accuracy'])}% over "
                        f"{eligible[best]['attempts']} battles).")
            msgs.append(f"Weakest topic: {worst} ({_pct(eligible[worst]['accuracy'])}% over "
                        f"{eligible[worst]['attempts']} battles).")

    # ---- recent form --------------------------------------------------------------------
    r10, r50 = _acc(subs[-10:]), _acc(subs[-50:])
    delta = r10 - r50
    out["recent10Accuracy"], out["recent50Accuracy"] = round(r10, 3), round(r50, 3)
    out["recentDelta"] = round(delta, 3)
    if n >= 10 and delta >= TREND_THRESHOLD:
        out["trend"] = "IMPROVING"
    elif n >= 10 and delta <= -TREND_THRESHOLD:
        out["trend"] = "DECLINING"
    elif n >= 10:
        out["trend"] = "STABLE"
    else:
        out["trend"] = None  # not enough history to call a trend
    if out["trend"]:
        word = {"IMPROVING": "up", "DECLINING": "down", "STABLE": "about the same"}[out["trend"]]
        msgs.append(f"Recent form: last 10 battles {_pct(r10)}% vs last {min(n, 50)} at {_pct(r50)}% "
                    f"({word}).")

    # ---- solve-time consistency ---------------------------------------------------------
    times = [r["solveTimeSec"] for r in subs if r["accepted"] and r.get("solveTimeSec")]
    out["solveTimeConsistency"] = None
    if len(times) >= 3 and statistics.mean(times) > 0:
        cv = statistics.pstdev(times) / statistics.mean(times)
        out["solveTimeConsistency"] = {"coefficientOfVariation": round(cv, 2),
                                       "label": "CONSISTENT" if cv < CONSISTENT_CV else "VARIABLE"}

    # ---- per-topic trend ----------------------------------------------------------------
    improving, declining = [], []
    if out["ready"]:
        for t, rows in by_topic.items():
            if len(rows) >= MIN_TOPIC_TREND_ATTEMPTS:
                ch = _topic_trend(rows)
                if ch >= TOPIC_TREND_THRESHOLD:
                    improving.append((t, ch))
                elif ch <= -TOPIC_TREND_THRESHOLD:
                    declining.append((t, ch))
    improving.sort(key=lambda x: -x[1]); declining.sort(key=lambda x: x[1])
    out["improvingTopics"] = [t for t, _ in improving]
    out["decliningTopics"] = [t for t, _ in declining]
    if improving:
        msgs.append(f"Improving in: {', '.join(out['improvingTopics'])}.")
    if declining:
        msgs.append(f"Slipping in: {', '.join(out['decliningTopics'])}.")

    # ---- matches: record, rating history, performance vs expectation --------------------
    if matches:
        ms = sorted(matches, key=lambda m: m["matchIndex"])
        res = [m["result"] for m in ms]
        out["record"] = {"wins": res.count("WIN"), "losses": res.count("LOSS"), "draws": res.count("DRAW"),
                         "winRate": round(res.count("WIN") / len(res), 3)}
        out["ratingHistory"] = [{"matchIndex": m["matchIndex"], "rating": m.get("ratingAfter"),
                                 "problem": m.get("problemTitle"), "result": m["result"]} for m in ms]

        score = {"WIN": 1.0, "DRAW": 0.5, "LOSS": 0.0}
        windows = []
        usable = [m for m in ms if m.get("predictedWinProb") is not None]
        for i in range(0, len(usable) - EXPECTATION_WINDOW + 1, EXPECTATION_WINDOW):
            w = usable[i:i + EXPECTATION_WINDOW]
            actual = statistics.mean(score[m["result"]] for m in w)
            predicted = statistics.mean(m["predictedWinProb"] for m in w)
            windows.append({"fromMatch": w[0]["matchIndex"], "toMatch": w[-1]["matchIndex"],
                            "actualWinRate": round(actual, 3), "predictedWinRate": round(predicted, 3),
                            "difference": round(actual - predicted, 3)})
        out["performanceVsExpectation"] = windows
        if windows:
            last = windows[-1]
            if last["difference"] >= EXPECTATION_THRESHOLD:
                label = "OVERPERFORMING"
                msgs.append(f"You're outperforming your rating: over your last {EXPECTATION_WINDOW} matches you "
                            f"won {_pct(last['actualWinRate'])}% vs {_pct(last['predictedWinRate'])}% expected.")
            elif last["difference"] <= -EXPECTATION_THRESHOLD:
                label = "UNDERPERFORMING"
                msgs.append(f"You're below expectation: over your last {EXPECTATION_WINDOW} matches you "
                            f"won {_pct(last['actualWinRate'])}% vs {_pct(last['predictedWinRate'])}% expected.")
            else:
                label = "AS_EXPECTED"
            out["performanceLabel"] = label

    return out
