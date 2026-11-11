# anyrepo-fixture

A made-up app used only to test Loopr (an AI agent app) on "any GitHub repo". Not a real product. All keys and names are made up.

## Setup
1. `cp .env.example .env` and fill `FIXTURE_API_KEY` and `FIXTURE_WEBHOOK_SECRET` (any value works).
2. `docker compose up -d` starts Postgres and Redis.
3. `npm install`
4. `npm run dev` serves the app on http://localhost:3000 (`/health` shows the database and keys).
5. `npm test`

<!-- merge-checklist proof 202611112221 -->
