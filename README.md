# Ghoomo Platform

Monorepo for the Ghoomo ride-sharing platform. Three independent workspaces — each with its own dependencies, environment file, and README.

```
ghoomo/
├── app/          # Mobile app — Expo + React Native (riders & drivers)
├── backend/      # API server — Node.js HTTP + WebSocket
├── web/          # Admin dashboard — React + Vite
└── package.json  # Root workspace: shared dev tooling + convenience scripts
```

## Prerequisites

- Node.js ≥ 18 and npm ≥ 9
- A PostgreSQL connection string (Supabase cloud or local Postgres)
- Expo Go (device testing) or Android Studio / Xcode (emulators)

---

## 1 — Install dependencies

From the repository root this installs the root dev tools plus all three workspaces in one step:

```bash
npm install
npm run install:all
```

---

## 2 — Configure environment

Each workspace manages its own `.env` file. **There is no shared root `.env`.**

```bash
# Backend
cp backend/.env.example backend/.env

# Mobile app
cp app/.env.example app/.env

# Admin web
cp web/.env.example web/.env
```

Edit each file and fill in real values. The table below shows which variables matter most for a first run:

| File | Variable | What it is |
|---|---|---|
| `backend/.env` | `SUPABASE_DB_URL` | Postgres connection string |
| `backend/.env` | `JWT_SECRET` | Signing secret for issued tokens |
| `app/.env` | `EXPO_PUBLIC_API_BASE_URL` | URL of the running backend |
| `app/.env` | `EXPO_PUBLIC_FIREBASE_*` | Firebase project credentials |
| `web/.env` | `VITE_API_URL` | URL of the running backend API |

See each workspace's `.env.example` for the full variable reference.

---

## 3 — Start for development

Open three terminals (or use the combined command):

```bash
# Terminal A — backend (http://localhost:4000 + ws://localhost:4000/ws)
npm run dev:backend

# Terminal B — mobile app (Expo Dev Server)
npm run dev:app

# Terminal C — admin dashboard (http://localhost:5173)
npm run dev:web

# Or all three at once with colour-coded output:
npm run dev
```

---

## Workspace overview

### `app/` — Mobile App

React Native / Expo application for end-users (riders) and drivers.

- **Auth:** Firebase (email/password + Google OAuth)
- **State:** Redux Toolkit
- **Maps:** OpenStreetMap
- **Build:** EAS Build + EAS Update (OTA)

→ See [`app/README.md`](./app/README.md) for setup, build, and OTA instructions.

### `backend/` — API Server

Single-file Node.js server (`server.js`). No framework — raw `http` module with a hand-rolled router and a `ws` WebSocket server on the same port.

- **Database:** PostgreSQL via `pg` pool (Supabase-compatible)
- **Storage fallback:** JSON file (`data/store.json`) for offline dev
- **Deploy:** Vercel serverless via `api/index.js`

→ See [`backend/README.md`](./backend/README.md) for the full API reference.

### `web/` — Admin Dashboard

React + Vite SPA for administrators to monitor rides, manage drivers, users, and bus routes.

- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Deploy:** GitHub Pages

→ See [`web/README.md`](./web/README.md) for build and deployment instructions.

---

## Useful commands

```bash
# Development
npm run dev              # all three workspaces concurrently
npm run dev:backend
npm run dev:app
npm run dev:web

# Building
npm run build:web        # web/dist/
npm run build:android    # EAS preview APK
npm run build:ios        # EAS iOS build

# Maintenance
npm run lint             # eslint across all workspaces
npm run format           # prettier across all workspaces
npm run clean            # wipe all node_modules + build artefacts
```

---

## Environment isolation — how it works

| Workspace | Env file | Loaded by |
|---|---|---|
| `backend/` | `backend/.env` | `dotenv` in `server.js` |
| `app/` | `app/.env` | Expo CLI (variables must be `EXPO_PUBLIC_*`) |
| `web/` | `web/.env` | Vite (`envDir: '.'`; variables must be `VITE_*`) |

Each workspace is completely self-contained. Changing a variable in `backend/.env` has no effect on the app or web builds, and vice versa.

---

## Troubleshooting

**Backend exits with DB URL error**  
Add `SUPABASE_DB_URL` (or `DATABASE_URL`) to `backend/.env`.

**Mobile app cannot reach backend**  
When testing on a physical device set `EXPO_PUBLIC_API_BASE_URL` to your LAN IP, e.g. `http://192.168.1.x:4000`.

**Web dashboard login fails or data doesn't load**  
Verify `VITE_API_URL=http://localhost:4000/api` in `web/.env` and confirm the backend responds at `/health`.

**Expo `EXPO_PUBLIC_*` variables not picked up**  
Variables are baked in at bundle time. Restart the Expo Dev Server after editing `app/.env`.
