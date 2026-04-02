# Ghoomo — Backend

Node.js HTTP + WebSocket server. Serves the REST API consumed by the mobile app and admin dashboard, and drives real-time ride/bus events over a persistent WebSocket connection.

## Tech stack

| Concern | Library |
|---|---|
| HTTP server | Node.js `http` (no Express) |
| Real-time | `ws` (WebSocket) |
| Database | PostgreSQL via `pg` (Supabase-compatible) |
| Auth tokens | Firebase ID-token verification + custom JWT |
| Config | `dotenv` |
| Deploy | Vercel (serverless, `api/index.js` entry) |

## Directory layout

```
backend/
├── server.js          # Main entry — HTTP router + WS server
├── storage.js         # DB abstraction (Postgres pool + JSON fallback)
├── api/
│   └── index.js       # Vercel serverless entry (wraps server.js)
├── scripts/
│   └── seed-role-users.js  # One-off seeding helper
├── supabase/
│   └── schema.sql     # Reference DDL for the Supabase project
├── data/
│   └── store.json     # Local JSON fallback (dev only, git-ignored in prod)
├── .env.example       # ← copy to .env and fill in
└── vercel.json        # Vercel routing config
```

## Environment setup

```bash
cp .env.example .env
# Edit .env — at minimum set SUPABASE_DB_URL (or DATABASE_URL)
```

The server loads `backend/.env` first. If it finds neither `PORT` nor a DB URL there it will also attempt to read the root `.env` (backwards-compat for existing setups).

### Minimum required variables

```env
# One of:
SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
```

For local Postgres without SSL:
```env
PGSSL=false
```

See `.env.example` for the full reference.

## Running locally

```bash
npm install
npm start          # node server.js → http://localhost:4000
```

Health check:
```
GET http://localhost:4000/health
```

WebSocket endpoint:
```
ws://localhost:4000/ws
```

## API reference

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for the full endpoint list.

Quick summary:

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/google-login` | Google OAuth login |
| POST | `/api/auth/firebase-login` | Firebase ID-token login |
| GET | `/api/bus-routes` | List bus routes |
| POST | `/api/bus-routes` | Create bus route |
| GET | `/api/bus-bookings` | List bus bookings |
| POST | `/api/bus-bookings` | Create bus booking |
| POST | `/api/rides/quote` | Get fare quote |
| POST | `/api/rides` | Create ride |
| GET | `/api/rides/:id` | Get ride |
| GET | `/api/rides/history/:userId` | Ride history |
| GET | `/api/drivers/nearby` | Nearby drivers |
| GET | `/api/admin/dashboard` | Admin stats |

## Deploying to Vercel

```bash
npm run deploy:vercel
```

The `vercel.json` routes all traffic through `api/index.js` which re-uses the same `server.js` logic.

## Seeding

```bash
npm run seed:roles   # creates demo user/driver/admin accounts
```
