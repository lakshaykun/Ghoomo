# Ghoomo — Admin Dashboard

React + Vite admin panel for managing rides, drivers, users, and bus routes. The app talks to the backend REST API only.

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
| Deploy | GitHub Pages (`gh-pages`) |

## Directory layout

```
admin/
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
    └── services/
    │   ├── api.js            # Axios instance + auth interceptors
    │   └── dashboardAPI.js   # Backend data-fetch helpers
    └── styles/               # Per-component CSS modules
```

## Environment setup

```bash
cd admin
cp .env.example .env
# Edit .env
```

### Variables

```env
# URL of the running Ghoomo backend
VITE_API_URL=http://127.0.0.1:4000/api

# Optional proxy target if you keep VITE_API_URL relative (/api)
VITE_BACKEND_ORIGIN=http://127.0.0.1:4000

```

Vite loads `.env` from the `admin/` directory. Variables prefixed `VITE_` are bundled into the client.

## Running locally

```bash
npm install
npm run dev     # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend origin configured in `VITE_BACKEND_ORIGIN` when you use a relative `VITE_API_URL`. When `VITE_API_URL` is absolute, requests go directly to that backend host and do not depend on the proxy.

## Building for production

```bash
npm run build      # outputs to admin/dist/
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

