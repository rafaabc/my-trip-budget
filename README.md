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
├── .env.example               # Environment variable template
└── package.json
```

## Author

[rafaabc](https://github.com/rafaabc)

## License

ISC
