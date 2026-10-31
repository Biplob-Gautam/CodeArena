"""Valid Parentheses. Input: string of ()[]{} characters. Output: bool."""
import random
import numpy as np

PAIRS = {"(": ")", "[": "]", "{": "}"}
OPEN, CLOSE = "([{", ")]}"

EXAMPLES = ["()", "(]"]

MANDATORY = [
    "()[]{}",     # three types side by side
    "([)]",       # right counts, wrong nesting order
    "{[]}",       # proper nesting
    "(",          # single opener
    ")",          # single closer
    "((()))",     # deep nesting
    "(((",        # only openers
]


def reference(s):
    stack = []
    for ch in s:
        if ch in PAIRS:
            stack.append(PAIRS[ch])
        elif not stack or stack.pop() != ch:
            return False
    return not stack


def _balanced(pairs):
    out, stack, opens_left = [], [], pairs
    while opens_left or stack:
        if opens_left and (not stack or random.random() < 0.5):
            o = random.choice(OPEN)
            out.append(o)
            stack.append(PAIRS[o])
            opens_left -= 1
        else:
            out.append(stack.pop())
    return "".join(out)


def gen_candidate():
    kind = random.choice(["valid", "valid", "flip", "delete", "random", "openers", "closers", "large_valid", "large_invalid"])
    if kind == "valid":
        return _balanced(random.randint(1, 8))
    if kind == "large_valid":
        return _balanced(random.randint(1000, 4000))
    if kind in ("flip", "delete", "large_invalid"):
        s = list(_balanced(random.randint(1, 8) if kind != "large_invalid" else random.randint(1000, 4000)))
        i = random.randrange(len(s))
        if kind == "flip":
            s[i] = random.choice(OPEN + CLOSE)
        elif kind == "delete" and len(s) > 1:
            del s[i]
        else:
            s[i] = random.choice(OPEN + CLOSE)
        return "".join(s)
    if kind == "random":
        return "".join(random.choice(OPEN + CLOSE) for _ in range(random.randint(1, 14)))
    if kind == "openers":
        return "".join(random.choice(OPEN) for _ in range(random.randint(1, 10)))
    return "".join(random.choice(CLOSE) for _ in range(random.randint(1, 10)))


def features(s):
    n = len(s)
    depth = cur = 0
    first_fail = n
    stack = []
    for idx, ch in enumerate(s):
        if ch in PAIRS:
            stack.append(PAIRS[ch])
            cur += 1
            depth = max(depth, cur)
        else:
            cur = max(0, cur - 1)
            if first_fail == n and (not stack or stack.pop() != ch):
                first_fail = idx
    return [
        np.log1p(n),
        sum(c in OPEN for c in s) / n,                       # opener ratio
        s.count("(") / n + s.count(")") / n,
        s.count("[") / n + s.count("]") / n,
        s.count("{") / n + s.count("}") / n,
        depth / n,                                           # nesting depth, relative
        first_fail / n,                                      # where it first goes wrong
        1.0 if reference(s) else 0.0,                        # valid / invalid
    ]
