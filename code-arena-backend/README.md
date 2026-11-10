# Code Arena Backend

## PostgreSQL and Prisma

1. Install the backend dependencies with `npm install`.
2. Create `.env` from `.env.example` if it does not exist, then set
   `DATABASE_URL` to your PostgreSQL connection string. The database must
   already exist. For local PostgreSQL, the URL format is:

   ```text
   postgresql://USER:PASSWORD@localhost:5432/code_arena?schema=public
   ```

3. Generate the Prisma Client:

   ```sh
   npm run db:generate
   ```

4. Create and apply the initial development migration:

   ```sh
   npm run db:migrate
   ```

   Prisma prompts for a migration name. Use `init` for the first migration.

Use `npm run db:deploy` to apply committed migrations in a deployment
environment, `npm run db:validate` to validate the Prisma schema, and
`npm run db:studio` to browse the database.

The application connects through the shared Prisma client in
`src/config/database.js`. The API server connects before listening and
disconnects from PostgreSQL during graceful shutdown.

## Curated problem data

The canonical seed contains the four curated problems and their judge cases.
Both `npm run db:seed` and `npm run seed:problems` apply this same data and
update existing seeded problems and test cases. Each problem has 10 test
cases, exactly two of which are visible to players, including large-input
coverage. Battle durations are 20 minutes for Easy, 30 minutes for Medium,
and 45 minutes for Hard problems.

## Submission evaluation

Submission evaluation uses BullMQ and Redis. Set `REDIS_URL` in the backend
environment (see `.env.example`) and ensure Redis is running before starting
the API with `npm run dev` or `npm start`. The API enqueues each accepted
submission, and the server starts and gracefully stops the evaluation worker
with its normal lifecycle. If enqueueing is unavailable, the API returns
`503` and records the submission as an internal error.

Run the backend tests with `npm test`.

Battles are completed by a server-side scheduler after their configured
deadline. Completion waits for submissions accepted before the deadline to
finish judging, determines the winner by the database-assigned submission
sequence, applies Glicko-2 ratings, and emits `battle:completed`. The
`submissionOrder` schema change requires applying the new Prisma migration
with `npm run db:deploy` (or `npm run db:migrate` during development).

## Realtime connections

The API server also hosts Socket.IO at `/socket.io`. The frontend connects using
the access token in the Socket.IO `auth.token` handshake field. Matchmaking
uses `matchmaking:find` and `matchmaking:cancel`; participants join an
authorized battle room with `battle:join` and receive `battle:state` and
`battle:presence` events. Battle submissions must use the authenticated
submission API; clients cannot broadcast submission contents over sockets.