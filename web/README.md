# Ghoomo — Admin Web Dashboard

React + Vite admin panel for managing rides, drivers, users, and bus routes. Connects to the Ghoomo backend over REST.

## Tech stack

| Concern | Library |
|---|---|
| Framework | React 18 |
| Bundler | Vite 5 |
| Routing | React Router 6 |
| HTTP client | Axios |
| Charts | Recharts |
| Styling | Tailwind CSS + per-component CSS |
| Icons | Lucide React |
| DB client | Supabase JS (optional direct access) |
| Deploy | GitHub Pages (`gh-pages`) |

## Directory layout

```
web/
├── index.html
├── main.jsx                  # App mount
├── vite.config.js            # Vite + proxy config
├── tailwind.config.js
├── .env.example              # ← copy to .env and fill in
└── src/
    ├── App.jsx               # Router setup + auth guard
    ├── index.css             # Global styles + Tailwind directives
    ├── context/
    │   └── AuthContext.jsx   # Admin auth state (localStorage token)
    ├── pages/
    │   ├── Login.jsx         # Admin login page
    │   └── Dashboard.jsx     # Layout shell + sidebar
    ├── components/           # Feature panels rendered inside Dashboard
    │   ├── Sidebar.jsx
    │   ├── StatCard.jsx
    │   ├── Overview.jsx      # KPI overview
    │   ├── Rides.jsx
    │   ├── Drivers.jsx
    │   ├── Users.jsx
    │   └── Routes.jsx        # Bus routes management
    ├── services/
    │   ├── api.js            # Axios instance + auth interceptors
    │   ├── dashboardAPI.js   # All dashboard data-fetch functions
    │   └── supabaseClient.js # Supabase client (optional direct queries)
    └── styles/               # Per-component CSS modules
```

## Environment setup

```bash
cd web
cp .env.example .env
# Edit .env
```

### Variables

```env
# URL of the running Ghoomo backend
VITE_API_URL=http://localhost:4000/api

# Only needed if you use Supabase direct access in dashboardAPI.js
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

Vite loads `.env` from the `web/` directory. Variables prefixed `VITE_` are bundled into the client; `SUPABASE_*` variables remain server-side (used via Vite's SSR or build-time injection only).

## Running locally

```bash
npm install
npm run dev     # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000` automatically, so no CORS issues during development.

## Building for production

```bash
npm run build      # outputs to web/dist/
npm run preview    # serves the built dist locally
```

## Deploying to GitHub Pages

```bash
npm run deploy     # runs build then gh-pages -d dist
```

Set `base: './'` is already configured in `vite.config.js` for correct asset paths on GitHub Pages.

## Auth flow

The admin dashboard uses a simple token-based auth:

1. `POST /api/auth/login` with admin credentials → receives a JWT.
2. Token is stored in `localStorage` under `admin_token`.
3. All subsequent API requests attach `Authorization: Bearer <token>`.
4. On 401, the token is cleared and the user is redirected to `/login`.

> The `shouldSendAuthHeader()` guard in `services/api.js` only sends the header from `localhost` / `127.0.0.1`. Remove or adjust this if you deploy the admin panel to a custom domain.
