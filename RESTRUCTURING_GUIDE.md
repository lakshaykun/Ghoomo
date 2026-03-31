# 📁 Project Restructuring Guide

## Changes Made

This document outlines all the structural and configuration changes made to convert the Ghoomo platform from a monolithic structure to a modular, production-grade monorepo architecture.

## Before vs After

### Before Structure
```
ghoomo-app/
├── android/          ❌ At root
├── ios/              ❌ At root
├── src/              ❌ At root (redundant with app/src)
├── app/
│   ├── .env
│   └── src/
├── App.js            ❌ At root
├── index.js          ❌ At root
├── app.json          ❌ At root
├── babel.config.js   ❌ At root
├── eas.json          ❌ At root
├── package.json      ❌ At root (Expo-specific)
├── tsconfig.json     ❌ At root
├── backend/
├── admin-web/        ❌ Not yet created in proper location
└── docs/
```

### After Structure
```
ghoomo-platform/          ← Root monorepo
├── app/                  ✅ All mobile app files
│   ├── src/             (merged with root src/)
│   ├── android/         ✅ Moved from root
│   ├── ios/             ✅ Moved from root
│   ├── App.js           ✅ Moved from root
│   ├── index.js         ✅ Moved from root
│   ├── app.json         ✅ Moved from root
│   ├── babel.config.js  ✅ Moved from root
│   ├── eas.json         ✅ Moved from root
│   ├── package.json     ✅ Moved from root
│   ├── tsconfig.json    ✅ Moved from root
│   └── .env             (keep for app-specific config)
├── backend/             ✅ Backend API server
│   ├── server.js
│   ├── src/
│   ├── package.json     (unchanged)
│   ├── .env             (backend-specific config)
│   └── .env.example
├── web/                 ✅ Admin dashboard (NEW location)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── package.json     ✅ Created
│   ├── .env.example     ✅ Created
│   └── README.md
├── package.json         ✅ Root monorepo config (NEW)
├── README_MONOREPO.md   ✅ Monorepo documentation (NEW)
├── .env.example         (root level)
├── docs/                (documentation files)
└── .git/
```

## File Movements

### Mobile App Files Moved to `/app`

| File | From | To | Status |
|------|------|-----|--------|
| `android/` | Root | `app/android/` | ✅ Moved |
| `ios/` | Root | `app/ios/` | ✅ Moved |
| `src/` | Root + `app/src/` | `app/src/` (merged) | ✅ Merged |
| `App.js` | Root | `app/App.js` | ✅ Moved |
| `index.js` | Root | `app/index.js` | ✅ Moved |
| `app.json` | Root | `app/app.json` | ✅ Moved |
| `babel.config.js` | Root | `app/babel.config.js` | ✅ Moved |
| `eas.json` | Root | `app/eas.json` | ✅ Moved |
| `package.json` | Root | `app/package.json` | ✅ Moved |
| `package-lock.json` | Root | `app/package-lock.json` | ✅ Moved |
| `tsconfig.json` | Root | `app/tsconfig.json` | ✅ Moved |

### Web Admin Files Created in `/web`

| File | Location | Status |
|------|----------|--------|
| `index.html` | `web/index.html` | ✅ Created |
| `app.js` | `web/app.js` | ✅ Created |
| `styles.css` | `web/styles.css` | ✅ Created |
| `README.md` | `web/README.md` | ✅ Created |
| `package.json` | `web/package.json` | ✅ Created |
| `.env.example` | `web/.env.example` | ✅ Created |

### New Root-Level Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Monorepo workspace configuration | ✅ Created |
| `README_MONOREPO.md` | Comprehensive monorepo documentation | ✅ Created |

## Configuration Updates

### 1. Root `package.json` (NEW)

```json
{
  "name": "ghoomo-platform",
  "workspaces": ["app", "backend", "web"],
  "scripts": {
    "start:app": "npm start --prefix app",
    "start:backend": "npm start --prefix backend",
    "start:web": "npm run serve --prefix web",
    "start:all": "concurrently \"npm run start:app\" \"npm run start:backend\" \"npm run serve --prefix web\""
  }
}
```

**Key Features:**
- Defines workspaces for monorepo management
- Provides unified start commands for all services
- Allows installing all dependencies with: `npm install`

### 2. App `package.json` (MOVED)

- **Changed `main` from:** `"main": "index.js"` (root reference)
- **Changed `main` to:** `"main": "index.js"` (app-relative)
- All scripts remain unchanged (Expo handles paths internally)

### 3. Web `package.json` (NEW)

```json
{
  "name": "ghoomo-admin-web",
  "type": "module",
  "scripts": {
    "serve": "http-server -p 8080 -c-1",
    "start": "npm run serve"
  }
}
```

### 4. Environment Configuration

#### App `.env` (unchanged)
- **Location:** `app/.env`
- Continues to use `EXPO_PUBLIC_*` variables
- Firebase and Google OAuth configuration
- `EXPO_PUBLIC_API_BASE_URL` maintains backend URL

#### Backend `.env` (unchanged)
- **Location:** `backend/.env`
- Database, JWT, and service credentials
- Server loads from `.env` at startup

#### Web `.env.example` (NEW)
- **Location:** `web/.env.example`
- Template for admin dashboard API configuration
- `REACT_APP_API_URL=http://localhost:4000/api`

## Import Path Updates

### For Mobile App

No changes needed - all imports are relative and remain valid:

```javascript
// ✅ Still works - relative import
import { useAppDispatch } from './store';

// ✅ Still works - no absolute path changes
import screens from './screens';
```

### For Backend

No changes needed - backend remains at `/backend` with same structure:

```javascript
// ✅ Still works
const { createStorage } = require("./storage");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
```

### For Web Admin

Updated API base URL configuration:

```javascript
// ✅ Updated in web/app.js
const CONFIG = {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
};
```

## Dependency Management

### How Dependencies Are Installed

**Option 1: Monorepo-aware install (Recommended)**
```bash
npm install                # Installs root + workspace dependencies
npm run install:all        # Explicit install all
```

**Option 2: Per-folder install**
```bash
npm install --prefix app    # Install only app deps
npm install --prefix backend # Install only backend deps
cd web && npm install       # Install web deps
```

### Dependency Isolation

Each module maintains its own dependencies:
- `app/` has React Native, Expo, Redux, Firebase
- `backend/` has Express, PostgreSQL driver, WebSocket
- `web/` has minimal deps (http-server for development)

No shared dependencies between modules - each is independently deployable.

## Build Configuration

### Expo Build (Mobile)

**Before:**
```bash
cd ghoomo-app
eas build -p android
```

**After:**
```bash
cd app
eas build -p android
```

The `eas.json` file at `app/eas.json` contains all build configuration.

### Backend Build

**Before & After (unchanged):**
```bash
cd backend
npm start
```

Backend server.js loads `.env` from `backend/` directory.

### Web Build

**Before (didn't exist):**
No standalone web app

**After:**
```bash
cd web
npm run serve  # Development
npm run build  # Build (static)
```

## Running the Application

### Development Mode

Terminal 1:
```bash
npm run start:backend
# API at http://localhost:4000
```

Terminal 2:
```bash
npm run start:app
# Expo dev server
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

Terminal 3:
```bash
npm run start:web
# Admin dashboard at http://localhost:8080
```

**Or all in one:**
```bash
npm run start:all
# Concurrently runs all three services
```

### Production Deployment

#### Mobile App (Android)
```bash
cd app
npm run build:android:prod
```

#### Backend
```bash
cd backend
# Deploy to cloud (Render, Heroku, etc.)
# Ensure .env variables are set in hosting platform
```

#### Web Admin
```bash
# Deploy /web folder to static hosting
# (Vercel, Netlify, AWS S3, etc.)
# Ensure REACT_APP_API_URL points to production backend
```

## API Integration Changes

### Mobile App

The mobile app's API service (`app/src/services/api.js`) uses dynamic URL resolution:

```javascript
export function getApiBaseUrl() {
  // 1. Check explicit environment variable
  const explicitConfigured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitConfigured) return explicitConfigured;

  // 2. Check app.json configuration
  const configured = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configured) return configured;

  // 3. Try to connect to Expo dev server host
  const expoHost = getHostUri();
  if (expoHost) return `http://${expoHost}:4000`;

  // 4. Platform-specific defaults
  if (Platform.OS === "android") return `http://10.0.2.2:4000`;
  return `http://localhost:4000`;
}
```

**No changes required** - already supports dynamic endpoints.

### Web Admin

The admin dashboard (`web/app.js`) reads API base URL from environment:

```javascript
const CONFIG = {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
};
```

**Updated** to support `.env` variables.

### Backend

Backend API endpoints remain unchanged:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/admin/dashboard`
- WebSocket `/ws`

All routes work with any host/port configuration.

## Database Configuration

### Supabase (PostgreSQL)

No changes to database configuration:
- Connection string remains in `backend/.env`
- Backend loads from working directory's `.env`
- Schema and migrations unchanged

```bash
# Backend .env
SUPABASE_DB_URL=postgresql://...
```

## Documentation

### New Root-Level Documentation

- **`README_MONOREPO.md`** - Complete monorepo guide
  - Project structure overview
  - Quick start instructions
  - Module details for each service
  - Configuration reference
  - Deployment procedures

### Existing Documentation (Preserved)

- **`docs/`** folder - Various guides
- **`backend/API_DOCUMENTATION.md`** - API endpoints
- **`web/README.md`** - Admin dashboard guide
- **`app/src/services/`** - Service documentation

## Git Configuration

No changes needed - `.gitignore` remains unchanged:
- Ignores `node_modules/` at any level
- Ignores `.env` files (`.env.example` is tracked)
- Ignores build artifacts (`*.apk`, `*.app`, etc.)

## Troubleshooting

### Issue: "Cannot find module" after restructuring

**Solution:** Make sure you're in the correct directory:
```bash
# ✅ Correct
cd app && npm start

# ❌ Incorrect
cd ghoomo-app && npm start
```

### Issue: Backend crashes with "Cannot find .env"

**Solution:** Backend now loads `.env` from its own directory:
```bash
# ✅ Correct
cd backend && npm start

# ❌ Incorrect (won't find .env)
cd ghoomo-app && npm start --prefix backend
```

### Issue: Web admin shows "Connection refused"

**Solution:** Verify backend is running and check API URL:
```bash
# Check backend
curl http://localhost:4000/api/health

# Check web .env
cat web/.env | grep API_URL
```

### Issue: Expo build fails after moving files

**Solution:** Verify app config:
```bash
# Check eas.json was moved
ls app/eas.json

# Check app.json references correct paths
cat app/app.json | grep projectId
```

## Rollback Procedure (If Needed)

If you need to revert to the old structure:

```bash
# 1. Restore backend (mostly unchanged)
git checkout HEAD -- backend/

# 2. Restore app files to root
mv app/android android
mv app/ios ios
mv app/src . (and merge)
mv app/App.js .
mv app/index.js .
# ... etc for all config files

# 3. Restore old root package.json
git checkout HEAD -- package.json

# 4. Clean up new folders
rm -rf web app package.json README_MONOREPO.md
```

## Summary of Benefits

✅ **Modular Structure** - Each service has its own dependencies and can be deployed independently

✅ **Clear Separation** - Frontend, backend, and admin are clearly separated

✅ **Easier Scaling** - Each module can scale independently

✅ **Better Onboarding** - New developers can focus on one module at a time

✅ **Simplified CI/CD** - Can build/deploy each module independently

✅ **Production Ready** - NPM workspaces support is industry standard

## Next Steps

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment variables:**
   ```bash
   cp app/.env.example app/.env (if needed)
   cp backend/.env.example backend/.env
   cp web/.env.example web/.env
   ```

3. **Test individual modules:**
   ```bash
   npm run start:app      # Test mobile
   npm run start:backend  # Test API
   npm run start:web      # Test admin
   ```

4. **Run full stack:**
   ```bash
   npm run start:all
   ```

---

**Restructuring Date:** 2024
**Version:** 1.0.0
