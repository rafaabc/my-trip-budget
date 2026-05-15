# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                  # production: node src/server.js
npm run dev                # development with auto-reload: nodemon src/server.js
npm test                   # unit tests: jest
npm run test:watch         # jest in watch mode
npm run test:unit:coverage # unit tests + c8 coverage → reports/coverage/
npm run test:api           # API tests: mocha (server must be running)
npm run test:api:report    # API tests + Mochawesome HTML report → reports/
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

### Unit tests (`tests/unit/`)
- **Framework**: Jest (`testEnvironment: node`), no real DB or HTTP server.
- **Location**: `tests/unit/<name>.service.test.js` mirroring `src/services/`.
- **Scope**: service layer only.
- **Mock pattern**: `jest.mock('../../src/models/<model>')` for Mongoose; `jest.mock('bcryptjs')` / `jest.mock('jsonwebtoken')` for external libs.
- **Error assertions**: `expect(fn()).rejects.toMatchObject({ status: <n>, message: '<str>' })`.
- **Naming**: each `it` description carries an AC suffix (e.g. `(AC1)`, `(AC2)`) for traceability to the User Story.
- **Test files**: `user.service.test.js` (US-01), `user.login.service.test.js` (US-02), `trip.service.test.js` (US-03), `trip.list.service.test.js` (US-04).
- **Run**: `npm test` (root).

### API tests (`tests/api/`)
- **Framework**: Mocha + Chai + Supertest; reports via Mochawesome.
- **Scope**: full HTTP layer against a real running server and real MongoDB.
- **Config**: `.mocharc.js` at repo root (`spec: tests/api/test/**/*.test.js`, `timeout: 30000`).
- **Hooks**: `tests/api/test/hooks/cleanup.js` opens a Mongoose connection and deletes all test data (`username: /^apitest_/`) after the suite; `tests/api/test/hooks/auth.js` registers and logs in a default test user.
- **Test data isolation**: every username created by the suite is prefixed `apitest_` — cleanup runs unconditionally via `mochaHooks.afterAll`.
- **Fixtures**: `tests/api/fixtures/users.json` and `trips.json` hold payloads for data-driven loops.
- **Run**: `npm run test:api` (spec reporter) · `npm run test:api:report` (HTML report → `reports/`).
- **Pre-requisite**: API server must be running (`npm run dev`) and MongoDB reachable.

## User Story Workflow (Jira → Code)

When implementing a US from Jira (project **SCRUM**, site `faelsabc21.atlassian.net`):

1. Fetch the issue — ACs and BRs define the required behavior.
2. Check whether the feature already exists in the `routes → controllers → services → models` chain.
3. Implement missing logic in `services/` — throw errors with `err.status` property.
4. Add/extend unit tests covering each AC and BR.
5. Update `resources/swagger.json` if the API surface changes; reference the SCRUM key in the endpoint `description` (e.g. `"(SCRUM-5)"`).
6. Branch: `feature/scrum-<n>-<slug>`. Commit and open a PR against `main` referencing the US.

## PR Workflow

When the user says **"vamos seguir com o PR"** (or equivalent signals like "let's open the PR", "create the PR"):

1. Review all changes implemented since the last PR.
2. Update **`CLAUDE.md`** if any convention, command, architecture detail, or workflow changed.
3. If **`README.md`** may need changes, **show the proposed updates to the user and wait for approval** before applying them — do not update README autonomously.
4. Commit the doc updates together with the feature, or as a separate commit before opening the PR.
5. Then create the PR referencing the relevant issue/US.

## Key Conventions

- Errors thrown from services carry an `err.status` property; controllers are expected to forward that as the HTTP status code.
- JWT payload shape: `{ sub: userId (string), username }`.
- All trip queries are scoped to `req.user.sub` — users can only see their own trips.
- Trips are indexed on `{ userId, departureDate: -1 }` and returned sorted newest-first.
- Swagger spec lives at `resources/swagger.json` (loaded statically by `app.js`).
