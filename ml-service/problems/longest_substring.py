"""Longest Substring Without Repeating Characters. Input: string. Output: int (length)."""
import random
import string
import numpy as np

EXAMPLES = ["abcabcbb", "bbbbb"]

MANDATORY = [
    "a",              # single character
    " ",              # single space
    "abcdef",         # all distinct
    "abba",           # repeat reaches back past the window start
    "dvdf",           # classic window-shrinking trap
    "aaaaaa",         # all same
]


def reference(s):
    last, start, best = {}, 0, 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best


def gen_candidate():
    kind = random.choice(["lower", "tiny_alpha", "distinct", "same", "mixed", "runs", "large_lower", "large_tiny", "large_distinct"])
    if kind == "lower":
        return "".join(random.choice(string.ascii_lowercase) for _ in range(random.randint(1, 25)))
    if kind == "tiny_alpha":
        return "".join(random.choice("ab") for _ in range(random.randint(1, 15)))
    if kind == "distinct":
        n = random.randint(1, 26)
        return "".join(random.sample(string.ascii_lowercase, n))
    if kind == "same":
        return random.choice(string.ascii_lowercase) * random.randint(1, 20)
    if kind == "mixed":
        pool = string.ascii_letters + string.digits + " !@#"
        return "".join(random.choice(pool) for _ in range(random.randint(1, 25)))
    if kind == "runs":
        out = ""
        for _ in range(random.randint(2, 6)):
            out += random.choice("abc") * random.randint(1, 4)
        return out
    if kind == "large_lower":
        return "".join(random.choice(string.ascii_lowercase) for _ in range(random.randint(1000, 5000)))
    if kind == "large_tiny":
        return "".join(random.choice("ab") for _ in range(random.randint(1000, 5000)))
    pool = string.ascii_letters + string.digits
    return "".join(random.sample(pool, 62)) * random.randint(10, 40)


def features(s):
    n = len(s)
    best = reference(s)
    max_run = run = 1
    for i in range(1, n):
        run = run + 1 if s[i] == s[i - 1] else 1
        max_run = max(max_run, run)
    freq = max(s.count(c) for c in set(s))
    return [
        np.log1p(n),
        len(set(s)) / n,                                   # character variety
        best / n,                                          # answer relative to length
        freq / n,                                          # most common character share
        max_run / n,                                       # longest identical run
        sum(c == " " for c in s) / n,
        sum(c.isdigit() for c in s) / n,
        sum(c.isupper() for c in s) / n,
    ]
