# myTripBudget

> REST API for managing personal trip records with JWT-based authentication.

## Description

myTripBudget is a Node.js REST API that allows users to register, authenticate, and manage their travel trips. Built with Express.js and MongoDB (Mongoose), it provides a secure, token-protected interface for creating and listing trips. Interactive API documentation is available via Swagger UI.

## Dependencies

- **Node.js** — v18 or higher recommended
- **MongoDB** — a running MongoDB instance (local or cloud, e.g. MongoDB Atlas)

## Technologies Used

| Package | Version | Purpose |
|---|---|---|
| express | ^5.2.1 | HTTP framework |
| mongoose | ^9.6.1 | MongoDB ODM |
| jsonwebtoken | ^9.0.3 | JWT generation and verification |
| bcryptjs | ^3.0.3 | Password hashing |
| dotenv | ^17.4.2 | Environment variable loading |
| swagger-ui-express | ^5.0.1 | Interactive API docs |
| nodemon | ^3.1.14 | Dev auto-reload (devDependency) |
| jest | ^29.7.0 | Unit test runner (devDependency) |

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rafaabc/myTripBudget.git
   cd myTripBudget
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the environment file:
   ```bash
   cp .env.example .env
   ```

4. Fill in `.env`:
   | Variable | Description |
   |---|---|
   | `PORT` | Port the server will listen on (default: `3000`) |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret key used to sign tokens |
   | `JWT_EXPIRES_IN` | Token expiry duration (e.g. `1h`, `7d`) |
   | `BASE_URL` | Public base URL (used in Swagger, e.g. `http://localhost:3000`) |

5. Start the server:
   ```bash
   npm run dev   # development (auto-reload)
   npm start     # production
   ```

   Swagger UI will be available at `http://localhost:<PORT>/api-docs`.

6. Run the unit tests:
   ```bash
   npm test
   ```

## Features

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | No | Create a new account |
| POST | `/api/users/login` | No | Authenticate and receive a JWT |

### Trips

All trip endpoints require a `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/trips` | Yes | Create a new trip |
| GET | `/api/trips` | Yes | List all trips for the authenticated user |

**Create trip body:**
```json
{
  "title": "Europe Summer",
  "departureDate": "2025-07-01",
  "returnDate": "2025-07-21"
}
```

## Tests

Unit tests cover the service layer (business logic) using Jest. No real database or HTTP server is required.

```bash
npm test          # run all unit tests
npm run test:watch  # watch mode
```

Tests are located in `tests/unit/` and mirror the `src/services/` structure. Each test case is annotated with the User Story acceptance criterion it covers (e.g. `AC1`, `AC2`, `AC3`).

| User Story | Coverage |
|---|---|
| US-01 / SCRUM-5 — User Registration | AC1 (201 created), AC2 (409 duplicate), AC3 (400 short password), BRs, required-field validation |
| US-02 / SCRUM-6 — User Login | AC1 (200 + token), AC2/BR1 (401 invalid credentials), AC3 (400 missing fields), AC4 (JWT payload shape) |
| US-03 / SCRUM-9 — Trip Registration | AC1 (201 created, userId scoped), AC2 (400 missing fields, 400 invalid date), AC3 (422 returnDate ≤ departureDate), BR1–BR3 |
| US-04 / SCRUM-10 — Trip List | AC1 (200 + user-scoped list), AC2 (trip shape: title, departureDate, returnDate), AC4 (empty array), BR1 (only user's trips), BR2 (newest-first order) |

## File Structure

```
myTripBudget/
├── src/
│   ├── server.js              # Entry point — loads env, connects DB, starts server
│   ├── app.js                 # Express app — registers routes and Swagger UI
│   ├── config/
│   │   └── db.js              # Mongoose connection helper
│   ├── routes/
│   │   ├── user.routes.js     # /api/users route definitions
│   │   └── trip.routes.js     # /api/trips route definitions (auth applied globally)
│   ├── controllers/
│   │   ├── user.controller.js # HTTP layer for user endpoints
│   │   └── trip.controller.js # HTTP layer for trip endpoints
│   ├── services/
│   │   ├── user.service.js    # Registration, login, bcrypt, JWT logic
│   │   └── trip.service.js    # Trip creation and listing business logic
│   ├── models/
│   │   ├── user.model.js      # Mongoose User schema
│   │   └── trip.model.js      # Mongoose Trip schema (indexed by userId + departureDate)
│   └── middleware/
│       └── auth.middleware.js # JWT verification — attaches req.user on success
├── resources/
│   └── swagger.json           # OpenAPI specification
├── tests/
│   └── unit/
│       ├── user.service.test.js       # Unit tests for user registration (US-01)
│       ├── user.login.service.test.js # Unit tests for user login (US-02)
│       ├── trip.service.test.js       # Unit tests for trip registration (US-03)
│       └── trip.list.service.test.js  # Unit tests for trip list (US-04)
├── .env.example               # Environment variable template
└── package.json
```

## Author

[rafaabc](https://github.com/rafaabc)

## License

ISC
