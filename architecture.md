# Ghoomo Architecture

This repository is a three-workspace monorepo for the Ghoomo ride-sharing platform.
Each workspace is self-contained, with its own dependencies, environment file, and run/build scripts.

## Tech Stack

- Mobile app: Expo, React Native, React, Redux Toolkit, React Navigation, AsyncStorage, Expo modules, EAS Build/Update.
- Backend: Node.js 18+, Express, PostgreSQL, `ws`, `dotenv`, `swagger-ui-express`, `nodemon`.
- Admin dashboard: React 18, Vite, Tailwind CSS, React Router, Recharts, Axios, Lucide icons, Supabase JS.
- Shared tooling: npm workspaces, Concurrently, ESLint, Prettier, GitHub Pages deployment for the admin app.

## High-Level Repository Layout

```text
Ghoomo/
├── LICENSE                         Project license.
├── package.json                    Root workspace scripts, shared dev tools, and npm workspaces.
├── README.md                       Main setup guide for the monorepo.
├── architecture.md                 This architecture note.
├── admin/                          Admin dashboard workspace.
├── app/                            Mobile app workspace.
└── backend/                        API server workspace.
```

## Root Files

- `LICENSE` - Legal license for the project.
- `package.json` - Declares the monorepo workspaces (`app`, `backend`, `admin`) and shared scripts like `dev`, `build:*`, `lint`, `format`, and `clean`.
- `README.md` - Main onboarding document with install, environment, development, and troubleshooting instructions.
- `architecture.md` - This file.

## `admin/` - Admin Dashboard Workspace

The admin app is a React + Vite single-page application for operations and monitoring.
It consumes backend APIs only; it does not talk directly to the database.

```text
admin/
├── index.html                      Vite HTML entry point.
├── main.jsx                        React bootstrap entry.
├── package.json                    Admin-specific dependencies and scripts.
├── README.md                       Admin setup and deployment notes.
├── tailwind.config.js              Tailwind theme and content paths.
├── vite.config.js                  Vite build/dev configuration.
└── src/
    ├── App.jsx                    Top-level app shell and routing.
    ├── index.css                  Global styles and Tailwind base imports.
    ├── components/                Reusable UI sections.
    │   ├── Drivers.jsx            Driver management views.
    │   ├── Monitoring.jsx         Health and analytics panels.
    │   ├── Overview.jsx           Dashboard summary widgets.
    │   ├── Rides.jsx              Ride management tables and actions.
    │   ├── Routes.jsx             Route and bus route views.
    │   ├── Sidebar.jsx            Main navigation layout.
    │   ├── StatCard.jsx           Small metric card component.
    │   └── Users.jsx              User management views.
    ├── context/
    │   └── AuthContext.jsx        Admin auth/session state.
    ├── pages/
    │   ├── Dashboard.jsx          Main dashboard page.
    │   └── Login.jsx              Admin login page.
    ├── services/
    │   ├── api.js                 Low-level API client helpers.
    │   └── dashboardAPI.js        Backend-facing dashboard endpoints.
    └── styles/                    Component-specific CSS files.
        ├── Dashboard.css          Dashboard styles.
        ├── Drivers.css            Driver page styles.
        ├── Login.css              Login page styles.
        ├── Monitoring.css         Monitoring page styles.
        ├── Overview.css           Overview page styles.
        ├── Rides.css              Rides page styles.
        ├── Routes.css             Routes page styles.
        ├── Sidebar.css            Sidebar styles.
        ├── StatCard.css           Stat card styles.
        └── Users.css              Users page styles.
```

### Admin Notes

- Uses `VITE_API_URL` from `admin/.env`.
- Root scripts expose `npm run dev:admin` and `npm run build:admin`.
- Deployment is set up for GitHub Pages.
- Admin endpoints are grouped around auth, admin analytics, bus data, and driver data.

## `app/` - Mobile App Workspace

The mobile app is the rider/driver client built with Expo and React Native.
The code is organized into feature layers so navigation, services, state, and platform integrations stay separate.

```text
app/
├── App.js                          React Native app entry.
├── app.json                        Expo app configuration.
├── babel.config.js                 Babel config for Expo/React Native.
├── eas.json                        EAS Build and Update profiles.
├── index.js                        Native entry registration.
├── package.json                    Mobile dependencies and Expo scripts.
├── README.md                       Mobile setup and release guide.
├── tsconfig.json                   TypeScript config for editor support.
├── android/                        Android native project.
│   ├── build.gradle                Top-level Gradle build config.
│   ├── gradle.properties           Android Gradle properties.
│   ├── gradlew / gradlew.bat       Gradle wrapper launchers.
│   ├── settings.gradle             Gradle project settings.
│   └── app/                        Android app module.
├── docs/                           Setup and OAuth troubleshooting notes.
│   ├── GOOGLE_OAUTH_FIX.md         Google sign-in recovery steps.
│   └── SETUP_QUICK_START.md        Fast setup checklist.
├── ios/                            iOS native project.
│   ├── Podfile                     CocoaPods configuration.
│   ├── Podfile.properties.json     CocoaPods properties.
│   └── Ghoomo/                     iOS app source and assets.
└── src/
    ├── components/                Shared UI components.
    │   ├── common/                Generic reusable components.
    │   └── map/                   Map-specific components.
    ├── constants/
    │   └── index.js               App-wide constants.
    ├── core/                      Shared domain primitives.
    │   ├── errors/                Error handling types and helpers.
    │   ├── logging/               Logging utilities.
    │   └── types/                 Shared type definitions.
    ├── infrastructure/            Integration adapters for platform services.
    │   ├── firebase/              Firebase integration wrappers.
    │   ├── http/                  HTTP client plumbing.
    │   ├── location/              Device location helpers.
    │   ├── notifications/         Push notification adapters.
    │   └── storage/               Local storage abstractions.
    ├── modules/
    │   └── api/                   Modular API clients and feature endpoints.
    ├── navigation/
    │   ├── AuthNavigator.js       Auth flow navigation.
    │   ├── DriverNavigator.js     Driver flow navigation.
    │   ├── RootNavigator.js       App-wide navigator composition.
    │   └── UserNavigator.js       Rider/user flow navigation.
    ├── screens/
    │   ├── auth/                  Authentication screens.
    │   ├── driver/                Driver screens.
    │   └── user/                  Rider/user screens.
    ├── services/
    │   ├── api.js                 Facade export for app API access.
    │   ├── appUpdate.js           OTA update helpers.
    │   ├── backgroundLocation.js  Background tracking service.
    │   ├── firebaseAuth.js        Firebase auth bridge.
    │   ├── firebaseConfig.js      Firebase configuration.
    │   ├── notifications.js       Notification registration and handling.
    │   └── realtime.js            Live update helpers.
    ├── store/
    │   ├── index.js               Redux store setup.
    │   └── slices/                Redux slices for app state.
    └── utils/
        ├── bus.js                Bus-related helper utilities.
        └── map.js                Map/math helpers.
```

### Mobile Notes

- The app is built around Expo and EAS, so OTA updates and native builds are part of the workflow.
- Auth is backed by the API layer and local token storage; Firebase remains in the stack for integration points such as Google sign-in and notifications.
- The API layer is split into modular clients under `src/modules/api`, with `src/services/api.js` acting as the public facade.
- Android and iOS folders are the native shells generated by Expo; most day-to-day product work lives in `src/`.

## `backend/` - API Server Workspace

The backend is a Node.js + Express API with PostgreSQL and WebSocket support.
Its runtime is organized under `backend/src` with the root `server.js` kept as a compatibility wrapper.

```text
backend/
├── package.json                    Backend dependencies and scripts.
├── README.md                       Backend setup, API, and deployment guide.
├── server.js                       Compatibility entry point for older tooling.
├── vercel.json                     Vercel deployment configuration.
├── scripts/
│   └── seed-demo-data.js           Demo data seed script.
└── src/
    ├── app.js                     Express app assembly.
    ├── server.js                  Server bootstrap and listener startup.
    ├── common/
    │   ├── middleware/            Shared middleware.
    │   └── utils/                 Shared utility functions.
    ├── config/
    │   ├── db.js                  Database connection setup.
    │   └── env.js                 Environment loading and validation.
    ├── db/
    │   ├── migrate.js             SQL migration runner.
    │   ├── schema.sql             Canonical database schema.
    │   └── migrations/            Versioned SQL migrations.
    ├── docs/
    │   ├── docs.routes.js         Documentation route wiring.
    │   └── openapi.js             OpenAPI spec generation.
    └── modules/
        ├── admin/                 Admin-focused backend features.
        ├── auth/                  Authentication and session flows.
        ├── bus/                   Bus booking and route domain.
        ├── driver/                Driver profile and ride workflows.
        └── ride/                  Ride lifecycle and request handling.
```

### Backend Notes

- Runs on Node.js 18+.
- Uses PostgreSQL through `pg` and `dotenv` for environment loading.
- Exposes HTTP API routes plus WebSocket support via `ws`.
- `src/db/schema.sql` is the canonical schema, while `src/db/migrations/` contains ordered SQL migrations.
- `scripts/seed-demo-data.js` seeds demo data for development or testing.

## Runtime And Architecture Notes

- Each workspace owns its own `.env` file; there is no shared root environment file.
- Root scripts are convenience wrappers, so development and builds can be started from the repository root.
- The admin dashboard talks only to backend endpoints.
- The mobile app is split into navigation, screens, state, infrastructure, and feature modules to keep platform code isolated.
- The backend is modular by domain, which keeps auth, rides, drivers, buses, and admin features separated.

## Quick Start Mental Model

1. Root `package.json` orchestrates the three workspaces.
2. `backend/` exposes the API and database layer.
3. `app/` consumes the API for rider and driver workflows.
4. `admin/` consumes the API for operational dashboards and monitoring.
