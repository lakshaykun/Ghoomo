# Ghoomo Platform

Monorepo for the Ghoomo ride platform:
- Mobile app (Expo + React Native)
- Backend API + WebSocket server (Node.js)
- Admin dashboard (React + Vite)

## Monorepo Structure

```text
Ghoomo/
├── app/                 # Mobile app (Expo)
├── backend/             # API server + realtime WebSocket
├── web/                 # Admin dashboard (React/Vite)
├── docs/ and app/docs/  # Supporting setup and migration docs
├── package.json         # Root workspace scripts
└── .env.example         # Root env template (app-focused)
```

## Tech Stack

- Mobile: Expo 54, React Native 0.81, Redux Toolkit, Firebase Auth
- Backend: Node.js, ws, PostgreSQL (Supabase-compatible), dotenv
- Web Admin: React 18, Vite 5, Tailwind, Axios

## Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL connection string (Supabase or local Postgres)
- Expo Go app (for device testing), or Android Studio / Xcode for emulators

## 1) Install Dependencies

From repository root:

```bash
npm install
```

This workspace install is the most reliable way to install root + app + backend + web dependencies.

## 2) Configure Environment

Create root `.env` file:

```bash
cp .env.example .env
```

Then add/update values in `.env`.

### Required backend variables

The backend currently requires a DB URL (it does not use JSON-file fallback):

```env
SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
# or DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
```

Recommended for local non-SSL Postgres:

```env
PGSSLMODE=disable
```

Optional backend tuning:

```env
PORT=4000
HOST=0.0.0.0
PG_POOL_MAX=20
PG_IDLE_TIMEOUT_MS=30000
PG_CONNECT_TIMEOUT_MS=10000
PLACE_SEARCH_TIMEOUT_MS=6000
SUPABASE_BOOTSTRAP_FROM_JSON=false
```

### Required app variables (Expo/Firebase/Google)

These are read as `EXPO_PUBLIC_*` values by the app:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_CLIENT_ID=

EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Optional web variable

```env
VITE_API_URL=http://localhost:4000/api
```

If not set, web currently falls back to a deployed backend URL.

## 3) Run the Project

Use separate terminals.

### Terminal A: Backend

```bash
npm run start:backend
```

Expected:
- API health: `GET http://localhost:4000/health`
- WebSocket endpoint: `ws://localhost:4000/ws`

### Terminal B: Mobile app

```bash
npm run start:app
```

Then use Expo options:
- `a` for Android emulator
- `i` for iOS simulator
- Expo Go on device via QR

### Terminal C: Admin dashboard

```bash
npm --prefix web run dev
```

Expected:
- Admin UI: `http://localhost:5173`

## Working Endpoints (Backend)

Core endpoints currently implemented in `backend/server.js` include:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google-login`
- `POST /api/auth/firebase-login`
- `GET /api/shared-rides`
- `GET /api/places/search`
- `GET /api/places/reverse`
- `GET /api/bus-routes`
- `POST /api/bus-routes`
- `GET /api/bus-bookings`
- `POST /api/bus-bookings`
- `POST /api/rides/quote`
- `POST /api/rides`
- `GET /api/rides/:rideId`
- `GET /api/rides/history/:userId`
- `GET /api/drivers/nearby`
- `GET /api/drivers/:driverId/dashboard`
- `POST /api/drivers/:driverId/status`
- `POST /api/drivers/:driverId/location`
- `GET /api/admin/dashboard`

## Important Notes

- Root scripts `start:web` and `start:all` currently reference `serve` for web, but the web package uses Vite (`dev`).
- Backend loads environment from root `.env` (not from `backend/.env`) due its current dotenv path.
- `backend/.env.example` exists but does not fully reflect runtime requirements (`SUPABASE_DB_URL` / `DATABASE_URL` are what matter for startup).

## Useful Commands

```bash
# root
npm run start:app
npm run start:backend
npm run build:web
npm run lint
npm run clean

# app
npm --prefix app run android
npm --prefix app run ios

# web
npm --prefix web run build
npm --prefix web run preview
```

## Troubleshooting

### Backend exits with DB URL error

Add one of these in root `.env`:

```env
SUPABASE_DB_URL=...
# or
DATABASE_URL=...
```

### Mobile app cannot reach backend

- Ensure backend is running on port 4000
- Set `EXPO_PUBLIC_API_BASE_URL=http://<YOUR-LAN-IP>:4000` when testing from a physical device

### Web login or data fetch fails

- Ensure `VITE_API_URL` points to your local backend (`http://localhost:4000/api`)
- Confirm backend responds at `/health`

## Additional Documentation

- `README_MONOREPO.md` (legacy monorepo guide)
- `QUICK_START.md` (quick setup reference)
- `RESTRUCTURING_GUIDE.md` (project restructuring details)
- `backend/API_DOCUMENTATION.md` (backend API notes)
- `web/README.md` (web-admin specific notes)
