# CodeArena — Project Context

> This document is the shared context for AI-assisted development on the CodeArena project.
> Paste this file into ChatGPT, Claude, Copilot, Cursor, or another coding assistant when starting work on the project.
>
> **Important:** This document describes the current agreed direction. It is not a license to introduce technologies or features without considering the project's constraints.

---

## 1. Project Overview

**CodeArena** is a real-time 1v1 competitive programming platform designed to turn DSA practice into competitive coding duels.

Two players of comparable skill are matched and receive the same programming problem. They solve it independently in an online code editor. Their submissions are executed in a sandboxed environment, and the first player to produce an accepted solution wins the duel.

The platform is intended primarily for engineering students and developers who already practice DSA on platforms such as LeetCode but want a more competitive, head-to-head experience.

The product is **not intended to replace LeetCode**. LeetCode is treated as an existing ecosystem that can help calibrate a new player's initial skill. CodeArena then develops its own competitive rating through actual CodeArena matches.

### Core product loop

```text
Register
   ↓
Initial rating calibration
   ↓
Find opponent
   ↓
Skill-compatible matchmaking
   ↓
Select a competitive problem
   ↓
1v1 real-time coding battle
   ↓
Submit C++ solution
   ↓
Sandboxed Docker execution
   ↓
Test against selected hidden test cases
   ↓
First accepted solution wins
   ↓
Glicko-2 rating update
   ↓
Match history + analytics
   ↓
Historical data improves future recommendations
```

---

# 2. Main Goals

The MVP should successfully demonstrate:

- User registration and authentication
- JWT-based authentication
- Optional Google OAuth
- Optional LeetCode account/rating information
- Initial CodeArena rating assignment
- Placement matches for new/unrated users
- Glicko-2 based competitive rating
- Rating-based matchmaking
- Real-time battle rooms using WebSockets + Socket.IO
- A browser-based C++ coding editor
- C++ code execution in isolated Docker containers
- A curated set of problem test cases
- Submission judging
- First accepted solution as the primary winner criterion
- Player profiles
- Leaderboard
- Match history
- Basic player statistics
- Problem/topic preferences
- ML-assisted problem selection when sufficient data exists
- A local development environment with no required cloud bill

The project has approximately **2 months of development time**, so scope control is critical.

---

# 3. Current Technology Direction

The current preferred stack is:

## Frontend

- React
- JavaScript
- Tailwind CSS
- Monaco Editor
- REST API communication
- Socket.IO client

The frontend does not need to use Next.js. React is sufficient for the current project.

## Backend

- Node.js
- TypeScript
- NestJS
- Fastify adapter
- REST APIs
- WebSockets
- Socket.IO

## Database

Either:

- MongoDB + Mongoose

or:

- PostgreSQL + Prisma

The database choice should be made based on implementation simplicity, team familiarity, and project requirements. Do not introduce both databases.

MongoDB is completely acceptable for the MVP if it provides faster and simpler development.

## Real-time state / caching

- Redis

Redis is intended for temporary, rapidly changing state rather than permanent application data.

## Code execution

- Docker
- C++ only for the initial version

No multiple-language judge is required for the MVP.

## Authentication

- JWT
- Google OAuth as an additional login method

## Rating

- Glicko-2 for CodeArena's competitive rating
- LeetCode rating only for initial calibration when available

## Machine Learning

Potential ML stack:

- Python
- scikit-learn
- LightGBM
- pandas / NumPy

The ML service can be separate from the NestJS backend, communicating through an internal HTTP API or another simple interface.

## Infrastructure

Development should work locally.

Cloud deployment is **optional**, not required.

The project should not depend on paid AWS/cloud services for the MVP. Docker Compose should be sufficient for local development.

---

# 4. Product Philosophy

CodeArena should feel like an **arena**, not another generic coding-practice website.

The core experience should be:

```text
Find opponent
      ↓
Opponent found
      ↓
Countdown
      ↓
Same problem
      ↓
Limited information during battle
      ↓
Code
      ↓
Submit
      ↓
Judge
      ↓
Winner
      ↓
Rating changes
```

The battle interface should intentionally be minimal.

During the battle, players should primarily see:

- Their username
- Opponent username
- Problem statement
- Relevant examples / selected visible testcase information
- C++ editor
- Timer
- Submit button
- Basic submission status

Players should **not** see the opponent's code during the duel.

Opponent runtime, detailed submission information, final comparison, and other match statistics can be revealed after the battle.

---

# 5. Rating System

CodeArena uses **two distinct concepts**:

### External rating

The user's LeetCode contest rating, if available.

Purpose:

- Initial skill calibration
- Helping establish an initial CodeArena rating

It is NOT the long-term CodeArena ranking.

### Internal rating

CodeArena's own **Glicko-2 rating**.

Purpose:

- Matchmaking
- Leaderboard
- Competitive progression
- Measuring actual CodeArena performance

Once a player starts playing CodeArena, their CodeArena rating should evolve independently of their LeetCode rating.

---

# 6. Initial Rating

## User with a LeetCode contest rating

Preferred flow:

```text
User registers
    ↓
Provides/links LeetCode username
    ↓
Obtain/validate publicly available rating information
    ↓
Convert LeetCode rating → initial CodeArena rating
    ↓
Create Glicko-2 state
```

Do not blindly trust a manually entered rating without considering verification.

The exact mechanism for obtaining LeetCode data must comply with applicable platform terms and technical constraints. Avoid designing the entire system around aggressive scraping.

LeetCode is an external calibration source, not a required identity provider.

## User without LeetCode rating

A user can select:

```text
I don't have a LeetCode account / contest rating
```

They receive a default provisional Glicko-2 state and enter a placement phase.

Example concept:

```text
Default provisional rating
        ↓
5 placement matches
        ↓
Higher rating uncertainty during placement
        ↓
Glicko-2 updates
        ↓
Established CodeArena rating
```

The exact initial rating, Glicko-2 parameters, and number of placement matches should be configurable rather than hard-coded throughout the application.

---

# 7. Glicko-2

CodeArena should use Glicko-2 rather than a plain Elo system.

Glicko-2 maintains:

- Rating
- Rating Deviation (RD)
- Volatility

The reason is that two players with the same rating may have very different levels of certainty.

Example:

```text
Player A
Rating: 1600
RD: 35

Player B
Rating: 1600
RD: 170
```

The system knows much more about Player A's stable skill.

This is particularly useful for:

- New players
- Placement matches
- Players who have been inactive
- Matchmaking confidence

Glicko-2 calculations should be implemented as a dedicated rating service/module so that the rest of the application does not depend on rating mathematics directly.

---

# 8. Matchmaking

The primary matchmaking signal is **CodeArena Glicko-2 rating**, not raw LeetCode rating.

A basic matchmaking flow:

```text
Player clicks Find Match
        ↓
Add player to Redis matchmaking queue
        ↓
Find compatible player
        ↓
Consider rating / rating uncertainty / preferences
        ↓
Create Match
        ↓
Remove players from queue
        ↓
Create Socket.IO battle room
```

The acceptable rating range can expand as a player waits longer.

Conceptually:

```text
0–10 sec   → narrow rating range
10–20 sec  → wider range
20–30 sec  → wider again
```

Exact thresholds should be configurable.

Matchmaking must avoid creating duplicate simultaneous matches for the same player.

---

# 9. Redis

Redis is not the permanent database.

Use the primary database for durable information such as:

- Users
- Problems
- Matches
- Submissions
- Ratings
- Rating history
- Match history
- Preferences

Use Redis for temporary/high-frequency information such as:

### Matchmaking queue

```text
waiting players
player rating
queue timestamp
preferences
```

### Battle state

```text
match status
players connected
room information
battle start time
battle end time
temporary state
```

### Presence

```text
online/offline
connected/disconnected
temporary session state
```

### Optional job queue

Redis can later be used to queue code execution jobs if needed.

Do not write every WebSocket event or timer tick to the main database.

A useful rule:

> Database = what happened / permanent state  
> Redis = what is happening right now / temporary state

---

# 10. WebSockets + Socket.IO

REST APIs are appropriate for normal request/response operations:

```text
Login
Register
Profile
Leaderboard
Match history
Problem information
Preferences
```

WebSockets are appropriate for live battle events.

Socket.IO should be used for:

```text
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

Each battle should have its own Socket.IO room:

```text
match:<matchId>
```

Both players join the room.

The backend is authoritative for:

- Battle start time
- Battle end time
- Submission timestamp
- Submission result
- Winner
- Rating update

Do not trust client-side timestamps for determining winners.

The client should not be able to say:

```text
"I won."
```

The server determines the winner.

---

# 11. Battle Lifecycle

A typical battle:

```text
MATCH FOUND
    ↓
Both players connect
    ↓
Both players enter battle room
    ↓
Server confirms both are ready
    ↓
Server records battle start timestamp
    ↓
Countdown
    ↓
CODING
    ↓
Player submits
    ↓
Backend records submission time
    ↓
Code execution service runs solution
    ↓
Test cases execute
    ↓
Result returned
    ↓
If ACCEPTED → player wins
    ↓
Battle ends
    ↓
Other player is notified
    ↓
Glicko-2 update
    ↓
Match history saved
```

For the MVP, the primary winner criterion is:

> **First player whose submitted solution receives ACCEPTED status wins.**

If both submissions are close enough to create a race condition, the backend's recorded event/result ordering must determine the outcome consistently.

Runtime and memory should be displayed as statistics rather than being the primary winner criterion.

Automatic Big-O analysis is out of scope for the MVP.

---

# 12. Docker Code Execution

User-submitted C++ is untrusted code.

Never execute it directly inside the NestJS application process or directly on the host machine.

Preferred architecture:

```text
Frontend
   ↓
NestJS
   ↓
Submission Service
   ↓
Execution Service
   ↓
Temporary Docker container
   ↓
Compile C++
   ↓
Run program
   ↓
Execute test cases
   ↓
Capture result
   ↓
Destroy/clean container
```

The execution environment should have resource restrictions such as:

- CPU limits
- Memory limits
- Execution timeout
- Network disabled
- Restricted filesystem
- Process limits
- Temporary working directory
- Automatic cleanup

Possible execution states:

```text
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

Example result:

```json
{
  "status": "ACCEPTED",
  "passedTests": 10,
  "totalTests": 10,
  "runtimeMs": 82,
  "memoryKb": 14320
}
```

Public exposure of arbitrary code execution must not happen until the sandbox has been sufficiently hardened and tested.

---

# 13. Problems

The product should use programming problems that are legally and technically appropriate to distribute.

The product goal is to leverage the familiarity of the LeetCode/DSA ecosystem, but the implementation should not assume that LeetCode's proprietary problem statements or private test suites can simply be copied or scraped.

Use a problem-provider abstraction:

```text
ProblemProvider
    ├── Local/curated problem provider
    └── External provider/integration if legitimately available
```

The backend should operate on a normalized problem representation, for example:

```text
Problem
├── id
├── title
├── description
├── difficulty
├── tags
├── constraints
├── examples
├── starterCode
└── testCases
```

This keeps the core system independent of a specific external data source.

---

# 14. Test Case Strategy

The MVP does not need hundreds of test cases per submission.

A curated test suite of approximately 10–15 tests can be used.

The test suite should aim to contain:

- Normal cases
- Boundary cases
- Small inputs
- Large inputs
- Duplicate-heavy inputs
- Negative values when relevant
- Zero when relevant
- Empty/single-element cases when valid
- Sorted/reverse-sorted cases when relevant
- Problem-specific adversarial cases

The final test suite should not be blindly random.

---

# 15. Test Case Clustering Model

One proposed ML component is K-Means clustering for test-case selection.

The idea:

```text
Large candidate test set
        ↓
Extract test-case features
        ↓
Cluster test cases
        ↓
Choose representative cases
        ↓
Add mandatory edge cases
        ↓
Final 10–15 test suite
```

Potential features:

- Input size
- Minimum value
- Maximum value
- Duplicate presence/ratio
- Sortedness
- Sparsity/density
- Empty input flag
- Single-element flag
- Negative-number flag
- Zero presence
- Other problem-specific features

Important:

> K-Means provides diversity/representativeness. It does not inherently know which test case is most likely to catch a buggy solution.

Therefore the final system should combine clustering with explicit edge-case rules.

The goal is:

> **Diverse + important + adversarial enough**, not merely "closest to cluster centers."

---

# 16. Machine Learning Architecture

The ML system should not be forced to make every decision.

Use deterministic algorithms where they are better:

- Glicko-2 → rating
- Basic rating-based filtering → matchmaking
- Server-side judging → correctness
- Match result → winner
- Basic analytics → profile graphs

Use ML where prediction/recommendation is actually useful.

The current proposed ML pipeline has four components.

---

# 17. Model 1 — Player Skill Profiling Engine

This is better described as a **skill profiling / feature engineering engine** rather than a predictive ML model.

It transforms match history into a player feature vector.

Possible inputs:

### Difficulty performance

```text
Easy accuracy
Medium accuracy
Hard accuracy
```

### Topic performance

```text
Array accuracy
String accuracy
Linked List accuracy
Tree accuracy
Graph accuracy
DP accuracy
etc.
```

### Solve-time features

```text
Average solve time by difficulty
Average solve time by topic
```

### Recent performance

```text
Recent-10 accuracy
Recent-50 accuracy
Recent-10 vs Recent-50 delta
```

### Consistency

```text
Variance in solve time
```

The output is a player skill vector.

Conceptually:

```text
Raw Match History
      ↓
Feature Aggregation
      ↓
Player Skill Vector
      ├── Profile analytics
      ├── Model 2 input
      └── Model 4 input
```

This model/engine must handle cold-start players carefully. With only a few matches, topic/difficulty statistics are unreliable.

Use smoothing, minimum sample thresholds, or neutral defaults rather than pretending sparse data is highly accurate.

Glicko-2 rating/RD/volatility should remain separate from the skill vector.

---

# 18. Model 2 — Problem Solve Probability

Candidate model:

**LightGBM**

Goal:

```text
Player + Problem
       ↓
Probability that player solves problem
```

Example:

```text
Player A + Problem X → 0.72
Player B + Problem X → 0.69
```

Potential features:

```text
Player skill vector
Problem tags
Problem difficulty
Problem historical acceptance rate
Player CodeArena rating
Player Glicko RD
Player performance on similar topics
Player performance at similar difficulty
Average solve time on similar problems
Recent performance
```

The initial proposed features are sufficient for a first version.

### Training label

A historical interaction needs a target such as:

```text
1 → accepted
0 → not accepted
```

A training row represents something like:

```text
(player, problem, features, solved)
```

The model learns:

```text
features → P(solve)
```

---

# 19. Problem Selection

The goal is not simply to find the easiest problem.

For two players A and B:

```text
P(A solves)
P(B solves)
```

A good candidate should generally:

- Be solvable
- Not be trivial
- Not be impossible
- Match requested topics when possible
- Give both players a reasonably similar chance

The initial target can be approximately:

```text
40%–70% solve probability
```

for both players, while minimizing the difference.

Example:

```text
Problem A
A = 0.68
B = 0.67
```

is highly competitive.

But:

```text
A = 0.08
B = 0.06
```

is technically balanced but probably a bad battle.

Therefore problem selection should consider both:

```text
Fairness
+
Solvability
+
Topic preference
+
Appropriate difficulty
```

---

# 20. Topic Preferences

Players can select preferred topics in settings:

```text
☑ Arrays
☑ Strings
☐ Linked Lists
☑ Dynamic Programming
☐ Graphs
```

When selecting a problem, preferences should influence the candidate pool.

However, preferences should not necessarily be 100% restrictive.

An eventual strategy could be:

```text
~80% preferred-topic candidates
~20% exploration/other topics
```

This prevents the user from repeatedly seeing the same tiny subset.

A "practice this topic" mode can give the selected topic a stronger weight.

---

# 21. Model 3 — Test Case Clustering

Candidate algorithm:

**K-Means**

Goal:

> Reduce a large candidate test set to a smaller, diverse set while preserving important input characteristics.

The model should not be presented as guaranteeing complete correctness.

The final test suite should combine:

```text
K-Means representative cases
+
Mandatory problem-specific edge cases
+
Potential adversarial cases
```

This should be evaluated empirically by checking whether known incorrect solutions are caught.

---

# 22. Model 4 — Match Outcome / Win Probability

Candidate model:

**Logistic Regression**

Goal:

```text
Player A
Player B
Problem
      ↓
P(A wins)
P(B wins)
```

Potential features:

```text
Rating difference
Glicko RD
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

Example:

```text
P(A wins) = 0.51
P(B wins) = 0.49
```

Important:

> Model 4 should complement Glicko-2, not replace it.

Glicko-2 estimates competitive strength.

Model 4 estimates the likely outcome of a particular duel under a particular problem.

---

# 23. Relationship Between Model 2 and Model 4

Model 2 can provide inputs to Model 4.

```text
Player A
   ↓
Model 2
   ↓
P(A solves problem)

Player B
   ↓
Model 2
   ↓
P(B solves problem)

             ↓
      Model 4
             ↓
      P(A wins)
      P(B wins)
```

This makes the models complementary.

---

# 24. Recommended Match/Problem Selection Pipeline

A future intelligent selection flow:

```text
Waiting players
      ↓
Glicko-2 matchmaking
      ↓
Candidate player pairs
      ↓
Candidate problem pool
      ↓
Filter/weight by player topic preferences
      ↓
Model 2 predicts solve probability
      ↓
Remove unsuitable problems
      ↓
Evaluate competitiveness
      ↓
Model 4 predicts win probability
      ↓
Select balanced problem
      ↓
Start battle
```

The system should prefer something like:

```text
A solve probability ≈ B solve probability
AND
both have reasonable solve probability
AND
problem matches preferences
AND
win probability is reasonably close
```

---

# 25. Cold Start for ML

The ML models cannot be accurate immediately because CodeArena initially has no historical data.

Therefore use a two-stage strategy.

### Stage 1 — Cold start

Use:

- Glicko-2
- Problem difficulty
- Topic preferences
- Global/historical problem acceptance
- Basic player statistics
- Deterministic heuristics

Collect data.

### Stage 2 — Data-driven

As enough CodeArena interactions accumulate:

```text
Matches
Submissions
Problems
Topics
Difficulty
Solve time
Accepted/failed
Player ratings
```

train and validate the models.

The system can progressively transition from heuristic recommendations to ML-assisted recommendations.

Do not fabricate model accuracy when there is insufficient training data.

---

# 26. Data That Should Be Collected From The Beginning

Design the backend so that future ML is possible.

For every submission, consider storing:

```text
submissionId
matchId
userId
problemId
language
status
passedTests
totalTests
runtime
memory
submittedAt
timeFromBattleStart
```

For every match:

```text
matchId
playerA
playerB
problemId
playerARatingBefore
playerBRatingBefore
playerAResult
playerBResult
winner
startedAt
endedAt
duration
```

For player performance:

```text
userId
problemId
difficulty
tags
accepted
solveTime
runtime
memory
```

For rating:

```text
userId
rating
ratingDeviation
volatility
ratingBefore
ratingAfter
matchId
```

For preferences:

```text
userId
preferredTopics
```

Do not store unnecessary personal data.

---

# 27. Profile Page

The profile can show data derived from the skill profile and match history.

Possible information:

```text
CodeArena Rating
Glicko RD
LeetCode Rating (if available)
Wins
Losses
Win rate
Current streak
Rating history
Topic performance
Difficulty performance
Average solve time
Recent performance
```

Example sections:

```text
Rating Progression
Topic Strength
Difficulty Performance
Match Statistics
Recent Matches
```

The graphs themselves are normal analytics; they do not need to be generated by ML.

---

# 28. Match History

Match history should definitely exist.

A match record can show:

```text
Opponent
Result
Problem
Difficulty
Your solve time
Opponent solve time
Runtime
Memory
Winner
Rating change
Date/time
```

A detailed match page can show:

```text
Player A
ACCEPTED
5m 42s
82ms
14MB

Player B
ACCEPTED
6m 13s
74ms
13MB

Winner: Player A

Rating:
A: 1542 → 1565
B: 1568 → 1545
```

The exact amount of information exposed should respect the desired privacy model.

---

# 29. Leaderboard

The leaderboard should primarily use:

**CodeArena rating**

Possible views:

```text
Global
Weekly
Monthly
```

The MVP can start with Global and optionally Weekly.

LeetCode rating should not determine the CodeArena leaderboard.

---

# 30. Suggested Pages

Core pages:

```text
Home / Dashboard
Login / Register
Profile
Leaderboard
Matchmaking
Battle
Battle Result
Match History
Match Details
Settings
```

Optional/future:

```text
Contests
Practice Mode
Player Analytics
Problem Explorer
```

A contest system should not delay the core 1v1 experience.

---

# 31. Authentication

The intended authentication flow:

```text
Email/password
       ↓
JWT
```

Optional:

```text
Google OAuth
       ↓
CodeArena account
```

The LeetCode account is separate from authentication.

Potential user fields:

```text
id
username
email
passwordHash (when applicable)
googleId (when applicable)
leetcodeUsername
leetcodeRating
leetcodeVerified
codeArenaRating
glickoRD
glickoVolatility
createdAt
updatedAt
```

Do not store OAuth secrets or sensitive credentials unnecessarily.

---

# 32. Backend Design Principles

The backend should be modular.

Possible NestJS modules:

```text
auth
users
profiles
problems
ratings
matchmaking
matches
submissions
execution
leaderboard
history
preferences
websocket
ml
```

Do not create microservices for every module.

The initial backend can be a modular monolith.

Use services/interfaces where future separation may be useful, especially around:

- Code execution
- ML inference
- Rating
- Problem providers

---

# 33. Important Architectural Rule

The backend should be authoritative.

Never trust the client for:

- Winner
- Battle timestamps
- Rating
- Submission status
- Match status
- Opponent identity
- Test results

The client displays server state.

---

# 34. No Unnecessary Cloud

The project should run locally without paid infrastructure.

A possible local environment:

```text
React
NestJS
MongoDB/PostgreSQL
Redis
Docker
ML service
```

Docker Compose can be used for infrastructure.

Cloud deployment can be considered later if the team wants a public demo.

The project should not introduce AWS merely for the sake of saying "AWS."

---

# 35. Public Launch / Real Users

A future goal is to get actual students/developers to use CodeArena and share the project through:

- Reddit
- X
- LinkedIn
- College communities
- Developer communities

This is valuable because real usage provides:

- Feedback
- Match data
- ML training data
- Product validation
- Portfolio/recruiter value

However, public access to the code execution system must be treated as a security concern.

Recommended progression:

```text
Local development
      ↓
Team testing
      ↓
Private beta
      ↓
Small invited user group
      ↓
Public launch
```

Do not expose unrestricted arbitrary C++ execution to the public before sandboxing, rate limiting, resource limits, cleanup, and monitoring are sufficiently robust.

---

# 36. MVP Scope

## Must Have

```text
✓ Authentication
✓ User profile
✓ Initial rating
✓ Placement matches
✓ Glicko-2
✓ Matchmaking
✓ Redis queue
✓ Socket.IO battle rooms
✓ Battle timer
✓ Problem display
✓ Monaco C++ editor
✓ C++ Docker execution
✓ Curated hidden tests
✓ Submission judging
✓ First accepted solution wins
✓ Rating update
✓ Leaderboard
✓ Match history
```

## Should Have

```text
✓ Topic preferences
✓ Player analytics
✓ Problem recommendation
✓ ML skill profiling
✓ LightGBM solve probability
✓ K-Means test-case selection
✓ Logistic win prediction
✓ Reconnection handling
✓ Rate limiting
✓ Automated testing
```

## Do Not Prioritize Before MVP

```text
✗ Multiple programming languages
✗ Voice chat
✗ Video chat
✗ AI coding assistant
✗ Complex tournament brackets
✗ Kubernetes
✗ Large microservice architecture
✗ Automatic Big-O analysis
✗ Full LeetCode clone
✗ Mobile app
```

---

# 37. 2-Month Development Strategy

### Weeks 1–2

Foundation:

```text
Project setup
Authentication
Database
User profiles
Problem schema
Basic APIs
Docker development environment
```

### Weeks 3–4

Competitive system:

```text
Glicko-2
Redis matchmaking
Match creation
Socket.IO
Battle rooms
Battle lifecycle
Timer
```

### Weeks 5–6

Judge:

```text
Monaco
C++ compilation
Docker execution
Test cases
Submission pipeline
Winner determination
Rating update
```

### Week 7

Product + ML:

```text
Leaderboard
History
Analytics
Preferences
ML pipeline
Problem recommendation
```

### Week 8

Freeze features:

```text
Testing
Security
Bug fixing
Performance
Documentation
Demo
Deployment if desired
```

Do not add major new features during the final week.

---

# 38. AI-Assisted Development Rules

When using an AI coding assistant with this context:

1. Understand the existing architecture before writing code.
2. Do not replace agreed technologies without a concrete reason.
3. Do not introduce a second database, framework, or unnecessary service.
4. Prefer simple solutions that satisfy the MVP.
5. Preserve API contracts and shared data models.
6. Treat the backend as authoritative.
7. Never suggest executing user code directly on the host process.
8. Keep security in mind for authentication, WebSockets, Docker execution, and user input.
9. When changing a shared schema/API, identify possible impact on other parts of the project.
10. Do not silently invent missing requirements.
11. If a requirement is ambiguous, explain the assumption before implementing it.
12. Prefer modular, testable code over premature abstraction.
13. Do not create fake ML functionality just to claim that a feature is AI-powered.
14. If an ML model lacks sufficient data, use a clearly defined cold-start fallback.
15. When recommending a dependency, explain why it is needed and whether an existing dependency can already solve the problem.
16. Keep secrets, tokens, passwords, OAuth credentials, and environment variables out of source control.
17. Use environment variables for configuration.
18. Do not commit `.env` files containing secrets.
19. Add tests for important business logic such as rating calculations, matchmaking, winner determination, and judging.
20. Before making large architectural changes, explain the trade-offs and impact.

---

# 39. Definition of "Done" for a Core Battle

The most important end-to-end test is:

```text
User A registers
       ↓
User B registers
       ↓
Both have valid CodeArena ratings
       ↓
Both click Find Match
       ↓
Matchmaking pairs them
       ↓
Redis stores queue/live state
       ↓
Match is created
       ↓
Socket.IO room is created
       ↓
Both players join
       ↓
Server starts battle
       ↓
Both see the same problem
       ↓
Both code independently
       ↓
One submits
       ↓
NestJS sends code to execution service
       ↓
Docker compiles and runs C++
       ↓
Selected tests execute
       ↓
Result = ACCEPTED
       ↓
Server declares winner
       ↓
Both clients receive battle:end
       ↓
Glicko-2 updates
       ↓
Match history is saved
       ↓
Leaderboard/profile updates
```

If this flow works reliably, the project has a strong MVP.

---

# 40. Long-Term Vision

The long-term CodeArena vision is:

> **A competitive programming arena where the system continuously learns what makes a good challenge for each player and uses that information to create increasingly balanced and engaging coding battles.**

The long-term feedback loop is:

```text
Play matches
     ↓
Collect performance data
     ↓
Update player skill profile
     ↓
Improve solve-probability predictions
     ↓
Improve problem selection
     ↓
Improve competitive balance
     ↓
More matches
     ↓
More data
```

The ML system should therefore be treated as an evolving component rather than something that must be perfect on launch.

---

# 41. Current Architectural Summary

```text
                         React + JS
                       Tailwind + Monaco
                              │
                     REST + Socket.IO
                              │
                              ▼
                    NestJS + TypeScript
                           Fastify
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
          ▼                   ▼                  ▼
      Database              Redis            ML Service
          │                   │                  │
          │              Match Queue             │
          │              Battle State            │
          │              Presence                │
          │                                     │
          ▼                                     ▼
 Users / Problems                         Skill / Prediction
 Matches / Submissions                    Models
 Ratings / History
                              │
                              ▼
                       Code Execution
                              │
                              ▼
                           Docker
                              │
                         C++ Runner
                              │
                              ▼
                        Test Results
                              │
                              ▼
                       Winner Decision
                              │
                              ▼
                         Glicko-2
                              │
                              ▼
                    Player Rating Update
```

---

# 42. Core Principle

The project should always optimize for this:

> **Build a working competitive coding arena first. Add intelligence where it meaningfully improves the experience.**

The technology exists to support the product, not the other way around.
