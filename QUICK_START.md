# ⚡ Quick Start - Production Setup

## Project Overview

Your project is now organized as a **monorepo** with three independent modules:

```
ghoomo-platform
├── app/         👤 Mobile app (React Native + Expo)
├── backend/     🔌 API server (Node.js + Express)
└── web/         🖥️ Admin dashboard (HTML/CSS/JS)
```

## One-Command Setup

```bash
# Clone and install everything
git clone <repo>
cd ghoomo-platform
npm run install:all
```

Then configure your environment variables in:
- `app/.env` - Mobile app config (Firebase, etc.)
- `backend/.env` - Backend config (Database, JWT, etc.)
- `web/.env` - Admin dashboard config (API URL)

## Running Services

### Option A: All Services Together
```bash
npm run start:all
```
- API: `http://localhost:4000`
- Mobile: Expo dev server (follow prompts)
- Admin: `http://localhost:8080`

### Option B: Individual Services

**Terminal 1 - Backend API**
```bash
npm run start:backend
# Or: cd backend && npm start
# API listening at http://localhost:4000
```

**Terminal 2 - Mobile App**
```bash
npm run start:app
# Or: cd app && npm start
# Press: a (Android) | i (iOS) | w (Web) | j (debug)
```

**Terminal 3 - Admin Dashboard**
```bash
npm run start:web
# Or: cd web && npm start
# Dashboard at http://localhost:8080
```

## Default Access

| Service | URL | Access |
|---------|-----|--------|
| Backend | `http://localhost:4000/api/...` | Any endpoint |
| Mobile | Expo tunnel | Via Expo CLI |
| Admin | `http://localhost:8080` | admin@example.com / password |

## Folder Reference

```
ghoomo-platform/
│
├── app/                          # Mobile App (React Native)
│   ├── src/                      # Source code
│   │   ├── components/           # Reusable components
│   │   ├── screens/              # App screens
│   │   ├── services/             # API, Firebase, etc.
│   │   ├── navigation/           # Navigation setup
│   │   ├── store/                # Redux store
│   │   └── utils/                # Utilities
│   ├── android/                  # Android native
│   ├── ios/                      # iOS native
│   ├── App.js                    # Expo entry
│   ├── app.json                  # Expo config
│   ├── eas.json                  # Build config
│   ├── package.json              # Dependencies
│   └── .env                      # Configuration
│
├── backend/                      # API Server (Express)
│   ├── src/                      # Source code
│   │   ├── app.ts               # Express setup
│   │   ├── modules/             # API modules
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Express middleware
│   │   └── database/            # DB connection
│   ├── server.js                # Entry point
│   ├── storage.js               # Data storage
│   ├── package.json             # Dependencies
│   ├── .env                     # Configuration
│   └── API_DOCUMENTATION.md     # Endpoint docs
│
├── web/                         # Admin Dashboard
│   ├── index.html               # Main HTML
│   ├── app.js                   # Dashboard logic
│   ├── styles.css               # Styling
│   ├── package.json             # Build tools
│   ├── .env                     # Configuration
│   └── README.md                # Guide
│
├── docs/                        # Documentation
│   ├── AUTH_QUICK_REFERENCE.md
│   ├── FIREBASE_SETUP.md
│   └── ...
│
├── package.json                 # Root monorepo config
├── README_MONOREPO.md           # Full documentation
└── RESTRUCTURING_GUIDE.md       # Migration guide
```

## Available Commands

### All Modules
```bash
npm run install:all          # Install dependencies
npm run start:all            # Start all services
npm run start:app            # Start mobile app
npm run start:backend        # Start API
npm run start:web            # Start admin dashboard
npm run test                 # Run tests
npm run lint                 # Lint all
npm run clean                # Clean build artifacts
```

### Mobile App
```bash
cd app
npm start                    # Dev server
npm run android             # Build for Android
npm run ios                 # Build for iOS
npm run build:android:apk   # Build APK
```

### Backend
```bash
cd backend
npm start                   # Start server
npm run seed               # Seed test data
```

### Admin Web
```bash
cd web
npm start                  # Dev server
npm run build             # Build assets
```

## Environment Setup

### Backend Database

Ensure PostgreSQL is running and create `.env`:

```bash
# backend/.env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ghoomo
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### Mobile App Configuration

Update `app/.env` with Firebase and Google OAuth credentials:

```bash
# app/.env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Admin Dashboard

Set API URL in `web/.env`:

```bash
# web/.env
REACT_APP_API_URL=http://localhost:4000/api
```

## API Endpoints

```
POST   /api/auth/register              # Register user
POST   /api/auth/login                 # Login
GET    /api/admin/dashboard            # Admin stats
GET    /api/rides                      # Available rides
POST   /api/rides/book                 # Book ride
GET    /api/users/:id                  # User profile
```

See `backend/API_DOCUMENTATION.md` for complete list.

## Mobile App Features

- ✅ User & driver profiles
- ✅ Real-time ride booking
- ✅ Live GPS tracking
- ✅ QR code verification
- ✅ Push notifications
- ✅ Firebase authentication
- ✅ Multiple payment methods

## Admin Dashboard Features

- ✅ Real-time metrics
- ✅ Ride management
- ✅ Driver management
- ✅ User management
- ✅ Route management
- ✅ Auto-refresh (30s)
- ✅ Session persistence

## Troubleshooting

### Backend won't start
```bash
# Check port 4000 is available
lsof -i :4000

# Check database connection
psql -h localhost -U postgres -d ghoomo
```

### Mobile app can't connect to backend
```bash
# Check backend is running
curl http://localhost:4000/api/health

# Update app/.env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Web admin shows "Connection refused"
```bash
# Verify backend is running
curl http://localhost:4000/api/admin/dashboard

# Check web/.env
REACT_APP_API_URL=http://localhost:4000/api
```

## Production Deployment

### Mobile App
```bash
cd app
npm run build:android:prod    # Build for Android
npm run build:ios             # Build for iOS (requires macOS)
```

Use **Expo EAS** for cloud builds.

### Backend
Deploy to Render, Heroku, or your hosting:
```bash
cd backend
# Set environment variables on hosting platform
# Git push triggers deployment
```

### Admin Dashboard
Deploy to Vercel, Netlify, or AWS S3:
```bash
# Simply upload /web folder
# Update API URL for production
```

## Next Steps

1. ✅ Install dependencies: `npm run install:all`
2. ✅ Configure `.env` files (see Environment Setup)
3. ✅ Start backend: `npm run start:backend`
4. ✅ Start mobile: `npm run start:app`
5. ✅ Start admin: `npm run start:web`
6. ✅ Test endpoints and UI

## Support

- 📖 Full guide: `README_MONOREPO.md`
- 🔄 Migration details: `RESTRUCTURING_GUIDE.md`
- 🔌 API docs: `backend/API_DOCUMENTATION.md`
- 🖥️ Admin guide: `web/README.md`

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2024
