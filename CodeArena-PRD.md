# Product Requirements Document (PRD)

## CodeArena

### 1. Product Overview

**Product Name:** CodeArena -- Real-Time 1v1 Competitive Programming
Platform\
**Version:** 1.0.0\
**Product Type:** Real-time competitive programming platform with online
code execution, skill-based matchmaking, rating, and ML-assisted problem
selection.

CodeArena is a real-time 1v1 competitive programming platform designed
to turn DSA practice into a competitive head-to-head experience. Two
players of comparable competitive strength are matched and receive the
same programming problem. Each player independently solves the problem
in a browser-based C++ editor. Submitted code is executed in an isolated
Docker environment against a limited, carefully selected hidden test
suite.

The primary winner criterion is the first player whose submission is
recorded by the server and passes the complete hidden test suite. If
neither player produces an accepted solution before the battle timer
expires, the match is treated as a draw.

CodeArena uses LeetCode contest rating only as an optional one-time
source for estimating a new player's initial CodeArena rating. CodeArena
then maintains its own competitive rating using Glicko-2. The CodeArena
rating becomes the primary rating used for matchmaking and leaderboard
ranking.

The platform is intended primarily for engineering students and
developers who already practice DSA and want a competitive, real-time
alternative to solving problems alone.

The core product loop is:

``` text
Registration / Login
        ↓
Initial rating calibration
        ↓
Placement matches for new players
        ↓
CodeArena Glicko-2 rating
        ↓
Find opponent
        ↓
Glicko-2 based matchmaking
        ↓
Win-probability based opponent refinement
        ↓
ML-assisted problem selection
        ↓
1v1 battle
        ↓
C++ submission
        ↓
Docker sandbox execution
        ↓
Hidden test suite
        ↓
Winner / Draw
        ↓
Glicko-2 rating update
        ↓
Match history + player insights
        ↓
Historical data improves future ML predictions
```

------------------------------------------------------------------------

### 2. Target Users

-   **Competitive Programming Students:** Engineering students who
    practice DSA and want a competitive way to improve.
-   **DSA Learners:** Users who want to practice specific topics such as
    arrays, graphs, or dynamic programming through head-to-head battles.
-   **Competitive Programmers:** Users interested in rating progression,
    matchmaking, leaderboards, and measurable performance.
-   **Developers / Recruiters / Technical Community:** Public users who
    may discover CodeArena through social platforms and use public
    profiles to evaluate competitive programming activity.

------------------------------------------------------------------------

### 3. Core Features

#### 3.1 User Authentication & Account

-   **User Registration:** Create an account using username, email, and
    password.
-   **LeetCode Information During Registration:** Users can optionally
    indicate that they have a LeetCode account/contest rating and
    provide their LeetCode username or relevant account information.
-   **No-LeetCode Option:** Users without a LeetCode account or contest
    rating can explicitly select that option.
-   **User Login:** Secure authentication using JWT.
-   **Google OAuth:** Users can create/login to a CodeArena account
    through Google OAuth.
-   **Token Management:** Access-token based authenticated sessions with
    refresh-token support where implemented.
-   **Password Management:** Authenticated users can change their
    password.
-   **Logout:** Invalidate/remove the user's authenticated session as
    appropriate for the selected JWT strategy.
-   **No Email Verification in MVP:** Email verification is
    intentionally excluded from the initial version to keep the project
    scope manageable.
-   **Public Username:** Each user has a unique public CodeArena
    username.

#### 3.2 LeetCode Rating Calibration

-   **Optional External Rating:** A user may provide a LeetCode account
    if they have one.
-   **One-Time Calibration:** LeetCode contest rating is used only to
    estimate the player's initial CodeArena rating.
-   **No Periodic Synchronization:** CodeArena does not continuously
    refresh or synchronize LeetCode rating after registration.
-   **Rating Separation:** LeetCode rating and CodeArena rating are
    stored separately.
-   **Validation:** If an automated/public-data lookup is used, the
    backend should obtain and validate the available rating rather than
    blindly trusting a manually entered number.
-   **Provider Independence:** The system should not make CodeArena
    authentication or core matchmaking dependent on LeetCode
    availability.

#### 3.3 Initial Rating and Placement Matches

Every new CodeArena player enters a provisional phase.

For a player with a LeetCode contest rating:

``` text
LeetCode contest rating
        ↓
Deterministic initial-rating conversion
        ↓
Initial CodeArena Glicko-2 state
        ↓
5 placement matches
        ↓
Established CodeArena rating
```

For a player without a LeetCode contest rating:

``` text
Default CodeArena Glicko-2 state
        ↓
5 placement matches
        ↓
Glicko-2 updates
        ↓
Established CodeArena rating
```

Both categories are considered provisional during the first five matches
because LeetCode performance does not necessarily equal CodeArena
performance.

The initial LeetCode-to-CodeArena conversion should be configurable. The
initial proposed mapping is:

``` text
CodeArena Initial Rating =
1500 + 0.5 × (LeetCode Rating - 1600)
```

The resulting value should be bounded by configurable minimum and
maximum values if required by implementation.

Example:

``` text
LeetCode 1400 → CodeArena 1400
LeetCode 1600 → CodeArena 1500
LeetCode 1800 → CodeArena 1600
LeetCode 2000 → CodeArena 1700
LeetCode 2200 → CodeArena 1800
```

This conversion is only a starting estimate. Actual CodeArena
performance determines the long-term rating.

#### 3.4 Glicko-2 Rating System

CodeArena uses Glicko-2 rather than plain Elo.

Each player's rating state contains:

-   Rating
-   Rating Deviation (RD)
-   Rating Volatility

After a completed match:

``` text
Match ends
    ↓
Determine result
    ↓
Run Glicko-2 calculation
    ↓
Update rating
    ↓
Update rating deviation
    ↓
Update volatility
    ↓
Store rating history
```

The rating system supports:

-   Win
-   Loss
-   Draw

A draw occurs when both players fail to produce an accepted solution
before the battle timer expires.

Glicko-2 is the primary competitive rating system for CodeArena.

LeetCode rating is not used for long-term leaderboard ranking after
initial calibration.

#### 3.5 Player Profile

Every user has a public profile.

The profile should display relevant non-sensitive information such as:

-   Username
-   CodeArena rating
-   Glicko-2 rating deviation where appropriate
-   LeetCode rating, if the user has chosen to provide it
-   Wins
-   Losses
-   Draws
-   Win percentage
-   Rating progression
-   Difficulty performance
-   Topic performance
-   Average solve time
-   Recent performance
-   CodeArena Insights
-   Match history summary

Sensitive account information such as password, private authentication
credentials, OAuth identifiers, and email address should not be exposed
publicly.

#### 3.6 Matchmaking

The matchmaking system pairs players primarily using their CodeArena
Glicko-2 rating.

A matchmaking request should:

``` text
Player clicks Find Match
        ↓
Player enters Redis matchmaking queue
        ↓
Find candidate opponents with compatible rating
        ↓
Consider rating deviation and waiting time
        ↓
Model 4 evaluates candidate pair competitiveness
        ↓
Select suitable opponent
        ↓
Create match
        ↓
Remove both players from queue
        ↓
Create/join Socket.IO battle room
```

The initial acceptable rating range should be narrow and may expand as
the player waits longer.

Glicko-2 rating remains the primary matchmaking constraint. Model-based
win probability is a refinement layer rather than a replacement for
Glicko-2.

The matchmaking system must prevent:

-   A player being matched with themselves.
-   A player being placed into multiple active matches.
-   Duplicate matchmaking assignments.
-   Stale queue entries from remaining indefinitely.
-   A player already in an active battle from entering a new match.

#### 3.7 Problem Topic Preferences

Users can select preferred topics from a controlled taxonomy.

Initial topic taxonomy:

``` text
Arrays
Strings
Hashing
Two Pointers
Sliding Window
Stack
Queue
Linked List
Binary Search
Sorting
Greedy
Recursion
Backtracking
Trees
Binary Search Tree
Heap / Priority Queue
Graphs
Dynamic Programming
Bit Manipulation
Math
```

Users can select one or multiple topics.

Topic preferences influence problem selection rather than directly
overriding the fairness system.

The problem-selection pipeline should prioritize preferred topics while
retaining some exploration so that the player is not permanently
restricted to a tiny problem pool.

A future implementation may use an approximate weighting such as:

``` text
Preferred-topic candidates → high priority
Other candidates → exploration priority
```

A dedicated practice mode is not required for the MVP, but the
problem-selection system should support a user's desire to practice
selected topics during a normal battle.

#### 3.8 Problem Bank

CodeArena will initially use a curated collection of highly well-known
and frequently practiced LeetCode problems rather than attempting to
reproduce the entire LeetCode problem catalog.

The initial release should focus on famous, commonly recognized DSA
problems that provide good competitive value across the supported topic
taxonomy.

Problems will be added directly to the CodeArena database using
scripts/code rather than through an admin dashboard.

Each normalized problem should contain information such as:

``` text
Problem ID
Title
Description
Difficulty
Tags
Constraints
Examples
Starter Code
Test Cases
```

The implementation must ensure that any external problem content
distributed by CodeArena is used in a manner permitted by the relevant
source's terms and applicable rights. The platform should not assume
that proprietary statements or private test suites can be copied without
permission.

The application should use a problem-provider abstraction where
practical so that additional legitimate/open-source problem sources can
be introduced later.

#### 3.9 Coding Battle

The battle is the core CodeArena experience.

Each battle has exactly two players.

The battle interface should display:

-   Player's username
-   Opponent's username
-   Player ratings
-   Problem statement
-   Problem examples
-   Two visible test cases
-   C++ code editor
-   Timer
-   Submit button
-   Submission status

The opponent's source code must not be visible during the battle.

Hidden test cases must remain hidden even when a submission fails.

The initial supported programming language is:

``` text
C++
```

Multiple programming languages are outside the MVP.

#### 3.10 Battle Duration

Battle duration is determined by problem difficulty:

``` text
Easy   → 20 minutes
Medium → 30 minutes
Hard   → 45 minutes
```

The server is authoritative for battle timing.

The frontend timer is a display of server-controlled battle state and
must not be trusted to determine whether a submission is on time.

When the battle timer expires:

-   If exactly one player has already received an accepted result, that
    player wins.
-   If neither player has received an accepted result, the match is a
    draw.
-   If both players have valid accepted submissions, the server's
    authoritative submission ordering determines the winner.

#### 3.11 Submission and Winner Determination

The primary winner criterion is:

> The first player to submit a solution that passes all required hidden
> test cases wins.

The backend must assign an authoritative ordering to submissions.

Example:

``` text
Player A → submission sequence 101
Player B → submission sequence 102
```

Even if B's Docker execution finishes before A's execution:

``` text
B → ACCEPTED
A → ACCEPTED
```

the system evaluates accepted submissions according to server-recorded
submission order.

Therefore:

``` text
submission #101 → ACCEPTED
submission #102 → ACCEPTED

Winner → Player A
```

The server must record the submission timestamp/sequence before
execution begins.

The client must never determine the winner.

#### 3.12 Test Cases and Hidden Tests

Each problem uses a limited, problem-specific judge suite, typically
containing approximately 10--15 test cases.

The suite should contain a mixture of:

-   Normal cases
-   Boundary cases
-   Small inputs
-   Large inputs
-   Duplicate-heavy cases where relevant
-   Negative values where relevant
-   Zero values where relevant
-   Empty/single-element cases where valid
-   Sorted/reverse-sorted cases where relevant
-   Problem-specific adversarial cases

Two test cases are visible to the player during the battle.

The remaining cases are hidden.

If a submission fails a hidden test case, the client receives only a
generic message such as:

``` text
Hidden testcase not passed
```

The client must not receive:

-   Hidden input
-   Expected output
-   Hidden test-case index
-   Detailed hidden-case failure information
-   Any information that allows reconstruction of the hidden suite

This prevents players from constructing hard-coded conditional solutions
against the small test suite.

#### 3.13 Docker Code Execution

User-submitted C++ code is untrusted and must never execute directly
inside the NestJS process or directly on the host.

The execution pipeline is:

``` text
Frontend
   ↓
NestJS Submission Service
   ↓
Execution Service
   ↓
Temporary Docker Container
   ↓
Compile C++
   ↓
Run executable
   ↓
Execute hidden tests
   ↓
Capture output/status/runtime/memory
   ↓
Return result
   ↓
Clean up container
```

The Docker execution environment should enforce restrictions such as:

-   CPU limit
-   Memory limit
-   Execution timeout
-   Network disabled
-   Restricted filesystem
-   Process/resource limits
-   Temporary workspace
-   Automatic cleanup

Possible submission states include:

``` text
QUEUED
COMPILING
RUNNING
ACCEPTED
WRONG_ANSWER
TIME_LIMIT
MEMORY_LIMIT
COMPILE_ERROR
RUNTIME_ERROR
SYSTEM_ERROR
```

Example execution result:

``` json
{
  "status": "ACCEPTED",
  "passedTests": 12,
  "totalTests": 12,
  "runtimeMs": 82,
  "memoryKb": 14320
}
```

Runtime and memory can be displayed as post-match statistics, but they
are not the primary winner criterion.

Automatic Big-O complexity analysis is outside the MVP.

#### 3.14 Real-Time Communication

CodeArena uses WebSockets with Socket.IO for live battle communication.

REST APIs are used for normal request/response operations such as:

``` text
Authentication
Profiles
Leaderboard
Match history
Problems
Preferences
```

Socket.IO is used for live events such as:

``` text
match:found
player:joined
battle:ready
battle:start
submission:started
submission:result
player:disconnected
player:reconnected
battle:end
```

Each match should have a Socket.IO room:

``` text
match:<matchId>
```

Both players join the room.

The server is authoritative for:

-   Battle start
-   Battle end
-   Submission ordering
-   Submission status
-   Winner
-   Draw
-   Rating changes

The system should support player reconnection where practical.

The application does not need to stream every keystroke to the opponent.

#### 3.15 Redis State Management

Redis is used for temporary and high-frequency state rather than
permanent application data.

Primary Redis uses:

### Matchmaking Queue

Stores information required to find waiting opponents efficiently, such
as:

``` text
user ID
CodeArena rating
rating deviation
queue timestamp
topic preferences
temporary queue status
```

### Active Battle State

Stores temporary live information such as:

``` text
match status
players
connection/presence state
battle start time
battle end time
room information
temporary submission/battle state
```

### Presence

Redis may track temporary online/offline or connection state.

### Optional Submission Queue

Redis may also support a submission/job queue if code execution needs
asynchronous processing.

Permanent data should remain in the primary database.

Mental model:

``` text
Database → What happened / durable information
Redis    → What is happening right now / temporary state
```

#### 3.16 Match Results

After a battle ends, the result page should display:

-   Winner or draw
-   Both players
-   Problem
-   Difficulty
-   Submission status
-   Solve/submission time
-   Runtime
-   Memory
-   Rating before and after
-   Rating change
-   Match duration

Example:

``` text
Winner: Player A

Player A
Accepted
5m 42s
82ms
14MB

Player B
Wrong Answer
---

Rating:
Player A: 1542 → 1565
Player B: 1568 → 1545
```

#### 3.17 Match History

Players can view their previous matches.

Each history item should include:

-   Match ID
-   Opponent
-   Result
-   Problem
-   Difficulty
-   Submission result
-   Solve/submission time
-   Runtime where available
-   Memory where available
-   Rating change
-   Date/time

A detailed match view may expose additional result information while
preserving hidden-test privacy.

#### 3.18 Leaderboard

The leaderboard uses CodeArena's Glicko-2 rating as the primary ranking
metric.

Possible leaderboard views:

``` text
Global
Weekly
```

The initial version may prioritize a global leaderboard and add
time-based views if implementation time permits.

LeetCode rating does not determine CodeArena leaderboard rank.

#### 3.19 Advanced CodeArena Insights

Player analytics are derived from historical match/submission data and
the Player Skill Profiling Engine.

Insights may include:

``` text
Strongest topics
Weakest topics
Difficulty performance
Average solve time
Recent-10 performance
Recent-50 performance
Recent performance delta
Solve-time consistency
Rating progression
Win/loss/draw trends
```

Example:

``` text
Strongest Topic: Arrays
Weakest Topic: Dynamic Programming

Easy Accuracy: 91%
Medium Accuracy: 73%
Hard Accuracy: 41%

Recent 10: 80%
Recent 50: 71%

Trend: Improving
```

These insights should be explainable and based on available historical
data.

#### 3.20 System Health

A health endpoint should expose basic backend/service health.

It may verify the availability of:

-   API service
-   Database
-   Redis
-   ML service where applicable

------------------------------------------------------------------------

### 4. Technical Specifications

#### 4.1 API Endpoints Structure

The exact implementation may evolve, but the backend should expose a
versioned REST API.

**Authentication Routes** (`/api/v1/auth/`)

-   `POST /register` - Register a new user
-   `POST /login` - Authenticate with email/username and password
-   `POST /logout` - Logout authenticated user
-   `GET /current-user` - Get current authenticated user
-   `POST /refresh-token` - Refresh access token where refresh tokens
    are used
-   `POST /change-password` - Change password for authenticated user
-   `GET /google` - Initiate Google OAuth
-   `GET /google/callback` - Handle Google OAuth callback

**User/Profile Routes** (`/api/v1/users/`)

-   `GET /:username` - Get public profile
-   `GET /me` - Get current user's profile
-   `PUT /me` - Update current user's profile
-   `GET /:username/insights` - Get public CodeArena insights where
    appropriate
-   `GET /me/stats` - Get detailed current-user statistics

**Problem Routes** (`/api/v1/problems/`)

-   `GET /` - List/filter available problems
-   `GET /:problemId` - Get problem details
-   `GET /:problemId/examples` - Get visible examples/test cases
-   `GET /topics` - Get supported problem topics

Problem creation is performed through scripts/database code in the MVP
rather than public/admin API endpoints.

**Matchmaking Routes** (`/api/v1/matchmaking/`)

-   `POST /join` - Enter matchmaking queue
-   `POST /leave` - Leave matchmaking queue
-   `GET /status` - Get current matchmaking status

Live matchmaking notifications should be delivered through Socket.IO.

**Match Routes** (`/api/v1/matches/`)

-   `GET /:matchId` - Get match information
-   `GET /:matchId/result` - Get completed match result
-   `GET /:matchId/history` - Get match details for a participant
-   `POST /:matchId/ready` - Mark player ready if the battle protocol
    uses an HTTP ready operation

**Submission Routes** (`/api/v1/submissions/`)

-   `POST /:matchId/submit` - Submit C++ code for the active match
-   `GET /:submissionId` - Get submission result for an authorized
    participant
-   `GET /:matchId/submissions` - Get authorized match submission
    information

Submission ordering and winner determination must remain
server-controlled.

**Leaderboard Routes** (`/api/v1/leaderboard/`)

-   `GET /` - Get global leaderboard
-   `GET /weekly` - Get weekly leaderboard where implemented

**History Routes** (`/api/v1/history/`)

-   `GET /me` - Get current user's match history
-   `GET /me/:matchId` - Get a specific match from current user's
    history

**Preferences Routes** (`/api/v1/preferences/`)

-   `GET /` - Get current user's problem preferences
-   `PUT /` - Update current user's problem topic preferences

**Health Check** (`/api/v1/healthcheck/`)

-   `GET /` - System/service health status

#### 4.2 WebSocket / Socket.IO Event Structure

The Socket.IO layer should support events conceptually similar to:

**Client → Server**

-   `matchmaking:join`
-   `matchmaking:leave`
-   `battle:join`
-   `battle:ready`
-   `submission:submit`
-   `battle:leave`

**Server → Client**

-   `match:found`
-   `battle:player_joined`
-   `battle:ready`
-   `battle:start`
-   `submission:queued`
-   `submission:running`
-   `submission:result`
-   `player:disconnected`
-   `player:reconnected`
-   `battle:end`

Event names may be adjusted during implementation, but the server must
remain authoritative.

Socket connections should be authenticated and authorized so that users
cannot join arbitrary private battle rooms.

#### 4.3 Match Lifecycle

``` text
MATCHMAKING
    ↓
MATCH_FOUND
    ↓
PLAYERS_CONNECT
    ↓
READY
    ↓
BATTLE_START
    ↓
CODING
    ↓
SUBMISSION
    ↓
JUDGING
    ↓
    ├── ACCEPTED → WINNER
    ├── FAILED → continue battle
    └── TIMEOUT → WINNER / DRAW
    ↓
MATCH_COMPLETE
    ↓
Glicko-2 UPDATE
    ↓
SAVE MATCH HISTORY
    ↓
UPDATE PLAYER STATISTICS
```

The match state should be represented using explicit states rather than
scattered booleans.

#### 4.4 Database Requirements

The application may use either:

``` text
MongoDB + Mongoose
```

or:

``` text
PostgreSQL + Prisma
```

Only one primary database should be used.

The database should persist at minimum:

### User

``` text
id
username
email
passwordHash where applicable
googleId where applicable
leetcodeUsername
leetcodeRating
leetcodeVerified where applicable
initialCodeArenaRating
codeArenaRating
glickoRatingDeviation
glickoVolatility
isProvisional
placementMatchesCompleted
createdAt
updatedAt
```

### Problem

``` text
id
title
description
difficulty
tags
constraints
examples
starterCode
testCaseMetadata
createdAt
updatedAt
```

Hidden test data must be protected from ordinary API responses.

### Match

``` text
id
playerA
playerB
problemId
status
startedAt
endedAt
duration
winner
result
playerARatingBefore
playerBRatingBefore
playerARatingAfter
playerBRatingAfter
createdAt
```

### Submission

``` text
id
matchId
userId
problemId
language
code reference / stored code where appropriate
sequenceNumber
submittedAt
status
passedTests
totalTests
runtime
memory
createdAt
```

### Rating History

``` text
userId
matchId
ratingBefore
ratingAfter
ratingDeviationBefore
ratingDeviationAfter
volatilityBefore
volatilityAfter
result
createdAt
```

### User Preferences

``` text
userId
preferredTopics
updatedAt
```

The exact schema will depend on the selected database.

#### 4.5 Machine Learning Service

ML models must run in a dedicated Python service.

They must **not be executed inside the Node.js/NestJS environment**.

Architecture:

``` text
NestJS Backend
      │
      │ HTTP request
      ▼
Python ML Service
      │
      ├── Skill profiling
      ├── LightGBM solve-probability model
      ├── Logistic regression outcome model
      └── Test-case clustering pipeline
```

The backend sends structured features to the ML service and receives
structured predictions.

Example conceptual request:

``` json
{
  "player": {
    "rating": 1580,
    "skillVector": []
  },
  "problem": {
    "difficulty": "MEDIUM",
    "tags": ["dynamic-programming"],
    "acceptanceRate": 0.54
  }
}
```

Example conceptual response:

``` json
{
  "solveProbability": 0.67
}
```

ML service communication should use internal HTTP APIs during the MVP.

The Python service may use:

-   Python
-   pandas
-   NumPy
-   scikit-learn
-   LightGBM

The exact deployment arrangement may remain simple for local
development.

#### 4.6 Player Skill Profiling Engine

The Player Skill Profiling Engine converts historical CodeArena
performance into a feature vector.

Inputs include:

``` text
Accuracy per difficulty:
    Easy
    Medium
    Hard

Accuracy per topic:
    Arrays
    Strings
    Trees
    Graphs
    Dynamic Programming
    etc.

Average solve time per difficulty
Recent-10 performance
Recent-50 performance
Recent-10 vs Recent-50 delta
Solve-time variance / consistency
```

Output:

``` text
Player Skill Vector
```

The vector is consumed by:

``` text
Model 2: Solve Probability
Model 4: Match Outcome Prediction
Advanced CodeArena Insights
```

This engine must handle sparse/cold-start players using neutral
defaults, smoothing, or minimum sample thresholds.

The skill vector is separate from Glicko-2 state.

#### 4.7 Problem Recommendation Model

Candidate algorithm/model:

**LightGBM**

Purpose:

> Predict the probability that a specific player will solve a specific
> candidate problem.

Inputs include:

``` text
Player Skill Vector
Problem tags
Problem difficulty
Problem historical acceptance rate
Player CodeArena rating
Player Glicko-2 rating deviation
Player performance on relevant topics
Player performance at relevant difficulty
Average solve time on similar problems
Recent performance where available
```

Output:

``` text
P(player solves problem)
```

Example:

``` text
Player A + Problem X → 0.72
Player B + Problem X → 0.69
```

Training labels:

``` text
1 → accepted
0 → not accepted
```

The model should be trained from historical CodeArena player/problem
interactions.

#### 4.8 Competitive Problem Selection

For a selected pair of players:

``` text
Candidate problems
      ↓
Apply topic-preference weighting
      ↓
Model 2 predicts solve probability
      ↓
Filter unsuitable problems
      ↓
Evaluate fairness + solvability
      ↓
Model 4 evaluates expected match competitiveness
      ↓
Select final problem
```

The system should generally prefer problems where:

``` text
P(Player A solves) ≈ P(Player B solves)
```

and both probabilities are within a useful competitive range, initially
approximately:

``` text
40%–70%
```

The selection should also account for:

-   Topic preferences
-   Problem difficulty
-   Problem availability
-   Historical problem acceptance
-   Fairness
-   Solvability

A problem where both players have a 5% solve probability is not
considered a good battle merely because their probabilities are close.

#### 4.9 Test-Case Clustering

Candidate algorithm:

**K-Means**

Purpose:

> Select a diverse and representative subset of test cases from a larger
> candidate set.

This process runs **offline when a problem/test suite is added**, not
every time a battle starts.

Pipeline:

``` text
Problem/test cases added
        ↓
Extract test-case features
        ↓
K-Means clustering
        ↓
Identify clusters
        ↓
Select representative cases
        ↓
Add mandatory edge cases
        ↓
Store final 10–15 case suite
```

Potential features:

``` text
Input size
Minimum value
Maximum value
Duplicate presence/ratio
Sortedness
Sparsity/density
Empty-input flag
Single-element flag
Negative-number flag
Zero presence
Problem-specific boundary features
```

K-Means provides diversity/representativeness. It does not guarantee
that the selected cases catch every incorrect algorithm.

The final test suite should combine:

``` text
Cluster representatives
+
Mandatory edge cases
+
Problem-specific adversarial cases
```

#### 4.10 Match Outcome Predictor

Candidate model:

**Logistic Regression**

Purpose:

> Predict the likely winner of a specific player-vs-player battle under
> a particular problem.

Potential inputs:

``` text
Player rating difference
Player Glicko-2 rating deviation
Skill vector difference
Problem difficulty
Problem tags
Player A topic performance
Player B topic performance
Player A solve probability
Player B solve probability
Average solve times
Recent performance
```

Output:

``` text
P(Player A wins)
P(Player B wins)
```

Example:

``` text
P(A wins) = 0.51
P(B wins) = 0.49
```

Model 4 complements Glicko-2.

Glicko-2 answers:

``` text
How strong/uncertain is the player overall?
```

Model 4 answers:

``` text
How competitive is this particular duel?
```

The matchmaking system should first use Glicko-2 to produce candidate
opponents, then use Model 4 to evaluate candidate pair competitiveness.

#### 4.11 ML Cold-Start Strategy

The platform initially has little or no CodeArena historical data.

Therefore ML models must not be treated as fully accurate from launch.

Initial system:

``` text
Glicko-2
+
Problem difficulty
+
Topic preferences
+
Global problem statistics
+
Basic player statistics
+
Deterministic heuristics
```

As CodeArena collects:

``` text
Matches
Submissions
Problems
Topics
Difficulty
Accepted/failed results
Solve time
Player ratings
```

the platform can train and validate the ML models.

The system should transition from heuristic recommendations toward
ML-assisted recommendations only when sufficient training data exists.

No fabricated ML predictions or unsupported accuracy claims should be
used.

------------------------------------------------------------------------

### 5. Permission Model

The MVP uses two system roles:

``` text
user
admin
```

The admin role is minimal.

There is no admin dashboard in the initial version.

Problems are added directly to the database using scripts/code.

### User

Users can:

-   Register/login
-   Manage their own profile
-   Manage their own preferences
-   Enter matchmaking
-   Leave matchmaking
-   Participate in battles
-   Submit code during their own battles
-   View their own match history
-   View public profiles
-   View the leaderboard

### Admin

The admin role is reserved for protected system-level operations if
needed during development, maintenance, or future expansion.

No general-purpose admin panel is required in the MVP.

------------------------------------------------------------------------

### 6. Security Features

-   JWT-based authentication
-   Secure password hashing
-   Google OAuth security
-   Input validation on all API endpoints
-   Authentication/authorization for protected REST endpoints
-   Authentication/authorization for Socket.IO connections
-   Authorization checks before joining battle rooms
-   Server-authoritative battle state
-   Server-authoritative submission ordering
-   Server-authoritative winner determination
-   Rate limiting for authentication and submission endpoints where
    appropriate
-   Protection against duplicate submissions where applicable
-   Docker sandboxing for arbitrary C++ execution
-   CPU and memory limits
-   Execution timeout
-   Network-disabled execution containers
-   Restricted container filesystem
-   Automatic container cleanup
-   Hidden test-case secrecy
-   No hidden test data in normal API responses
-   CORS configuration
-   Environment variables for secrets/configuration
-   No secrets committed to source control
-   Protection against stale/duplicate matchmaking entries
-   Validation of user-supplied LeetCode information where technically
    feasible

The public system must not expose unrestricted user code execution until
the Docker execution environment has been sufficiently hardened.

------------------------------------------------------------------------

### 7. Code Execution & Test Management

CodeArena's code judge is one of the highest-risk components because it
executes untrusted user code.

The execution system should use an isolated Docker environment for every
submission or controlled execution unit.

A submission should follow:

``` text
Receive submission
      ↓
Validate match/user/status
      ↓
Assign authoritative submission sequence
      ↓
Queue execution
      ↓
Create/reuse controlled execution environment
      ↓
Compile C++
      ↓
Run against hidden tests
      ↓
Apply CPU/memory/time restrictions
      ↓
Compare output
      ↓
Generate result
      ↓
Notify battle room
      ↓
Clean resources
```

Only two sample test cases should be visible to the player.

Hidden cases should remain hidden under all ordinary failure conditions.

The system should not return detailed information that lets users
reconstruct hidden tests.

Test-case clustering is performed offline.

------------------------------------------------------------------------

### 8. Machine Learning

CodeArena's ML system consists of four major components.

#### 8.1 Player Skill Profiling

Transforms historical performance into a reusable skill vector.

``` text
Match/Submissions
       ↓
Feature aggregation
       ↓
Player Skill Vector
       ├── Model 2
       ├── Model 4
       └── Advanced Insights
```

#### 8.2 Problem Solve Probability

**Model:** LightGBM

``` text
Player Skill Vector
+
Problem Features
       ↓
LightGBM
       ↓
P(player solves problem)
```

#### 8.3 Test-Case Clustering

**Model:** K-Means

``` text
Candidate test cases
       ↓
Feature extraction
       ↓
K-Means
       ↓
Representative cases
       +
Mandatory edge cases
       ↓
Final hidden test suite
```

This runs offline during problem/test-suite preparation.

#### 8.4 Match Outcome Prediction

**Model:** Logistic Regression

``` text
Player A
Player B
Problem
Player skill/rating features
       ↓
Logistic Regression
       ↓
P(A wins)
P(B wins)
```

The model helps identify candidate pairings with similar expected win
probability but does not replace Glicko-2.

#### 8.5 ML Feedback Loop

The long-term system is:

``` text
Players play
     ↓
Collect match/submission data
     ↓
Update player skill features
     ↓
Improve training dataset
     ↓
Retrain/validate models
     ↓
Improve problem selection
     ↓
Create more competitive battles
```

------------------------------------------------------------------------

### 9. Development / Deployment Constraints

The project has approximately two months of development time and a
four-person team.

The initial version should prioritize a complete working battle loop
over feature quantity.

The application should be able to run locally without paid cloud
infrastructure.

A local development environment may contain:

``` text
React frontend
NestJS backend
MongoDB OR PostgreSQL
Redis
Python ML service
Docker execution environment
```

Docker Compose may be used to coordinate local infrastructure.

Cloud deployment is optional and is not a product requirement for the
MVP.

The MVP should not require:

-   Kubernetes
-   Complex microservice infrastructure
-   Multiple programming languages
-   Paid cloud services
-   Mobile applications
-   Voice/video chat
-   AI coding assistants
-   Complex tournament systems
-   Automatic Big-O analysis

------------------------------------------------------------------------

### 10. Success Criteria

The CodeArena MVP is considered successful when the following end-to-end
flow works reliably:

``` text
User A registers
       ↓
User B registers
       ↓
Users receive initial CodeArena rating
       ↓
Users complete placement where applicable
       ↓
Users enter matchmaking
       ↓
Redis maintains queue state
       ↓
Compatible players are matched
       ↓
Socket.IO battle room is created
       ↓
Both players receive the same problem
       ↓
Two visible test cases are shown
       ↓
Both players independently code in C++
       ↓
One player submits
       ↓
Server records submission order
       ↓
C++ executes inside Docker
       ↓
Hidden test suite runs
       ↓
Accepted / failed result is produced
       ↓
First accepted submission wins
       ↓
If neither solves before timeout → draw
       ↓
Both clients receive final result
       ↓
Glicko-2 rating is updated
       ↓
Match history is stored
       ↓
Leaderboard/profile statistics update
       ↓
Player Skill Profile updates
       ↓
Historical data becomes available for ML training
```

Additional success criteria:

-   Authentication works reliably without email verification.
-   Google OAuth can authenticate users.
-   LeetCode rating can be used for one-time initial calibration where
    available.
-   Users without LeetCode ratings can complete placement matches and
    establish a CodeArena rating.
-   Matchmaking uses CodeArena Glicko-2 rating as the primary
    competitive signal.
-   Model 4 can be used as a secondary competitiveness signal when
    sufficient training data exists.
-   Problem recommendation can use Model 2 to estimate solve
    probabilities.
-   User topic preferences influence candidate problem selection.
-   Test-case clustering can prepare a diverse offline test suite.
-   Docker execution prevents ordinary user code from directly accessing
    the host.
-   Hidden test cases remain secret.
-   Public profiles and leaderboards work without exposing sensitive
    user information.
-   The system can operate locally without mandatory paid cloud
    infrastructure.
-   The core battle loop remains functional even when ML models are
    unavailable by using the defined cold-start/heuristic fallback.
-   The system is structured so that additional problem sources and
    programming languages can be introduced after the MVP without
    rewriting the core product.
