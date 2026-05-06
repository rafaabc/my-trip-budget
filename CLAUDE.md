# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # production: node src/server.js
npm run dev      # development with auto-reload: nodemon src/server.js
npm test         # unit tests: jest
npm run test:watch  # jest in watch mode
```

API docs available at `http://localhost:<PORT>/api-docs` (Swagger UI) once the server is running.

## Environment Variables

Copy `.env.example` to `.env` before running:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | JWT TTL (e.g. `1h`, `7d`) |
| `BASE_URL` | Public base URL (used in Swagger) |

## Architecture

Layered Express + Mongoose REST API. Request flow: `routes → controllers → services → models`.

- **`src/server.js`** — entry point; loads `.env`, connects MongoDB, starts HTTP server
- **`src/app.js`** — Express app factory; mounts Swagger UI at `/api-docs`, user routes at `/api/users`, trip routes at `/api/trips`
- **`src/config/db.js`** — Mongoose connection helper
- **`src/middleware/auth.middleware.js`** — JWT Bearer token verification; attaches `req.user = { sub, username }` on success
- **`src/routes/`** — thin routers; trip routes apply `authMiddleware` globally
- **`src/controllers/`** — HTTP layer only; delegates to services, catches `err.status` for response codes
- **`src/services/`** — all business logic and validation (required fields, date ordering, bcrypt, JWT signing)
- **`src/models/`** — Mongoose schemas; `toJSON` transform maps `_id → id` and strips `__v` and `passwordHash`

## Testing Conventions

- **Framework**: Jest (`testEnvironment: node`), no real DB or HTTP server in unit tests.
- **Location**: `tests/unit/<name>.service.test.js` mirroring `src/services/`.
- **Scope**: unit tests cover the `services/` layer only. No E2E or HTTP integration tests.
- **Mock pattern**: `jest.mock('../../src/models/<model>')` for Mongoose; `jest.mock('bcryptjs')` / `jest.mock('jsonwebtoken')` for external libs.
- **Error assertions**: `expect(fn()).rejects.toMatchObject({ status: <n>, message: '<str>' })`.
- **Naming**: each `it` description carries an AC suffix (e.g. `(AC1)`, `(AC2)`) for traceability to the User Story.

## User Story Workflow (Jira → Code)

When implementing a US from Jira (project **SCRUM**, site `faelsabc21.atlassian.net`):

1. Fetch the issue — ACs and BRs define the required behavior.
2. Check whether the feature already exists in the `routes → controllers → services → models` chain.
3. Implement missing logic in `services/` — throw errors with `err.status` property.
4. Add/extend unit tests covering each AC and BR.
5. Update `resources/swagger.json` if the API surface changes; reference the SCRUM key in the endpoint `description` (e.g. `"(SCRUM-5)"`).
6. Branch: `feature/scrum-<n>-<slug>`. Commit and open a PR against `main` referencing the US.

## Key Conventions

- Errors thrown from services carry an `err.status` property; controllers are expected to forward that as the HTTP status code.
- JWT payload shape: `{ sub: userId (string), username }`.
- All trip queries are scoped to `req.user.sub` — users can only see their own trips.
- Trips are indexed on `{ userId, departureDate: -1 }` and returned sorted newest-first.
- Swagger spec lives at `resources/swagger.json` (loaded statically by `app.js`).
