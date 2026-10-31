# Each name here is a module in this folder that follows the problem-module contract:
#   EXAMPLES      list of inputs shown to players (the 2 visible cases)
#   MANDATORY     list of hand-picked edge-case inputs that must always be in the suite
#   gen_candidate()  -> a random valid input (or None to skip)
#   features(inp)    -> list of numbers describing the input (used by K-Means)
#   reference(inp)   -> the trusted correct output for the input
ALL = [
    "max_subarray",
    "two_sum",
    "valid_parentheses",
    "binary_search",
    "longest_substring",
    "number_of_islands",
]
