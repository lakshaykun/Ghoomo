# Ghoomo Backend (Modular Architecture)

Backend is a feature-modular Express + PostgreSQL backend aligned with the canonical schema.

## Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   └── utils/
│   │       ├── helpers.js
│   │       └── logger.js
│   ├── docs/
│   │   ├── docs.routes.js
│   │   └── openapi.js
│   ├── db/
│   │   ├── schema.sql
│   │   ├── migrate.js
│   │   └── migrations/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── driver/
│   │   ├── ride/
│   │   ├── sharedRide/
│   │   ├── bus/
│   │   └── admin/
│   ├── app.js
│   └── server.js
├── api/
│   └── index.js
├── server.js
└── package.json
```

Each module follows:

```text
<module>/
├── <module>.controller.js
├── <module>.service.js
├── <module>.repository.js
├── <module>.routes.js
└── <module>.schema.js
```

## Environment

Copy `.env.example` to `.env` and set at least one DB URL:

- `SUPABASE_DB_URL`
- `DATABASE_URL`

## Run

```bash
npm install
npm run db:migrate
npm start
```

Demo data:

```bash
npm run seed:demo
```

Test logins use the password `DemoPass123!` with these accounts:

- `demo.student@ghoomo.test` - rider
- `demo.passenger@ghoomo.test` - rider
- `demo.driver1@ghoomo.test` - driver
- `demo.driver2@ghoomo.test` - driver
- `demo.busdriver@ghoomo.test` - bus_driver
- `demo.admin@ghoomo.test` - admin

Health check:

- `GET /health`

Docs:

- `GET /docs`
- `GET /openapi.json`

## Notes

- Legacy compatibility paths are preserved for key endpoints such as:
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/bus-routes`
  - `/api/bus-bookings`
  - `/api/rides`
  - `/api/admin/dashboard`
- Legacy `user` roles are normalized to `rider`; driver profiles now store vehicle and location data in separate tables.
- Root `server.js` now acts as a compatibility wrapper and exports `vercelHandler` for `api/index.js`.
