# Sport Heroes Backend

This is the Express-based sports scoring data platform for Sport Heroes, starting with a modular design supporting dynamic rules engines (beginning with Table Tennis).

---

## Prerequisites

Before running the application, make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (running locally or hosted instance)

---

## Quick Start

### 1. Install Dependencies
Navigate to the project root and install package dependencies:
```bash
npm install
```

### 2. Configure Environment variables
Create a `.env` file in the root directory. You can copy the template from `.env.example`:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
```env
PORT=3000
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<dbname>
```
*Note: Make sure the target database `<dbname>` exists in your PostgreSQL instance.*

### 3. Run the Development Server
Launch the server locally with hot-reloading:
```bash
npm run dev
```
The server will boot, test connection to your PostgreSQL database, and listen on the configured port.

### 4. Build and Run for Production
To bundle the TypeScript code into JavaScript:
```bash
npm run build
npm start
```

---

## Folder Structure

```
sportheroes-backend/
├── src/
│   ├── config/
│   │   └── database.ts        # Database connection pool & health tests
│   ├── modules/
│   │   ├── sports/
│   │   │   └── table-tennis.config.ts  # Dynamic rules configuration
│   │   ├── scoring/
│   │   │   └── scoring-engine.ts       # Event-driven scoring state manager
│   │   └── matches/
│   │       └── match-router.ts         # Match management endpoints
│   ├── app.ts                 # Express app initialization
│   └── server.ts              # Server bootstrapper & DB validator
├── .env                       # Local environment variables (git-ignored)
├── .env.example               # Template environment configuration
├── tsconfig.json              # TypeScript compilation rules
└── package.json               # Scripts & dependencies definition
```

---

## Verification & API Endpoints

Once the server is running, you can test connectivity and API responses using curl or Postman:

### 1. Health check & DB Connectivity
Checks if the Express app is running and verifies its connection to the PostgreSQL database.
- **Request:** `GET http://localhost:3000/health`
- **Successful Response (Database Connected):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-07-01T10:15:30.000Z",
    "services": {
      "database": "connected",
      "server": "running"
    }
  }
  ```

### 2. Create a Table Tennis Match
Creates a new Table Tennis match instance using the dynamic Table Tennis configuration.
- **Request:** `POST http://localhost:3000/matches/create`
- **Body (JSON):**
  ```json
  {
    "matchId": "match-123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Table Tennis match created successfully",
    "match": {
      "matchId": "match-123",
      "sportKey": "table_tennis",
      "status": "scheduled",
      "currentSetIndex": 0,
      "sets": [{ "player1Score": 0, "player2Score": 0 }],
      "setWins": { "player1": 0, "player2": 0 },
      "winnerId": null
    }
  }
  ```

### 3. Start the Match
Starts the scoring sequence by setting the match status to `live`.
- **Request:** `POST http://localhost:3000/matches/start`
- **Body (JSON):**
  ```json
  {
    "matchId": "match-123"
  }
  ```

### 4. Post Score Event (Event-Driven Scoring)
Updates the scores dynamically based on the registered events. 
- **Request:** `POST http://localhost:3000/matches/event`
- **Body (JSON):**
  ```json
  {
    "matchId": "match-123",
    "playerId": "player1",
    "eventType": "point_won"
  }
  ```
- **Response:** The response will contain the updated match scores. The engine automatically rolls over to the next set once a player wins 11 points (with a minimum lead of 2 points), and ends the match when a player wins 3 sets (best of 5 sets).

### 5. Check Live Score
Retrieves the match state and the sequence of historical score events.
- **Request:** `GET http://localhost:3000/matches/match-123`