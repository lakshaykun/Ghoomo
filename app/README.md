# Ghoomo — Mobile App

Expo + React Native application for riders and drivers. Supports both Android and iOS, with OTA updates via EAS Update.

## Tech stack

| Concern | Library |
|---|---|
| Framework | Expo 54 / React Native 0.81 |
| Navigation | React Navigation 6 (stack + bottom tabs) |
| State | Redux Toolkit |
| Auth | Firebase Auth (email/password + Google OAuth) |
| Maps | OSM (react-native-maps) |
| Notifications | Expo Notifications |
| Background location | Expo Task Manager |
| Build / OTA | EAS Build + EAS Update |

## Directory layout

```
app/
├── index.js                   # Expo entry point (registers App component)
├── App.js                     # Root navigator mount + store provider
├── app.json                   # Expo config (slug, EAS project ID, etc.)
├── eas.json                   # EAS Build profiles (preview / production)
├── babel.config.js
├── tsconfig.json
├── .env.example               # ← copy to .env and fill in
├── docs/
│   ├── GOOGLE_OAUTH_FIX.md    # Common Google OAuth troubleshooting
│   └── SETUP_QUICK_START.md   # First-run checklist
├── android/                   # Android native project (managed by Expo)
├── ios/                       # iOS native project (managed by Expo)
└── src/
    ├── components/
    │   ├── common/            # Reusable UI (Button, Input, Card, Badge…)
    │   └── map/               # Map components (OSM route, driver discovery)
    ├── constants/
    │   └── index.js           # Colors, spacing, fare tables, status enums
    ├── navigation/
    │   ├── RootNavigator.js   # Auth-gate: switches Auth ↔ Main stack
    │   ├── AuthNavigator.js   # Login / Register screens
    │   ├── UserNavigator.js   # Rider tab navigator
    │   └── DriverNavigator.js # Driver tab navigator
    ├── screens/
    │   ├── auth/              # Login, Register, Splash
    │   ├── user/              # Home, BookRide, BusBooking, Tracking…
    │   └── driver/            # DriverHome, BusDriverRoute, OTP…
    ├── services/
    │   ├── api.js             # REST client (fetch wrapper with retry)
    │   ├── firebaseConfig.js  # Firebase app + auth init
    │   ├── firebaseAuth.js    # Sign-in / sign-up helpers
    │   ├── realtime.js        # WebSocket client (ride/bus events)
    │   ├── notifications.js   # Push notification helpers
    │   ├── backgroundLocation.js # Background location task
    │   └── appUpdate.js       # EAS OTA update checker
    ├── store/
    │   ├── index.js           # Redux store setup
    │   └── slices/            # authSlice, bookingSlice, driverSlice…
    └── utils/
        ├── map.js             # Coordinate helpers
        └── bus.js             # Bus route / booking helpers
```

## Environment setup

```bash
cd app
cp .env.example .env
# Edit .env — set Firebase keys and API base URL
```

All variables use the `EXPO_PUBLIC_` prefix so Expo bundles them into the JS bundle at build time.

### Minimum required variables

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000   # or your backend URL

# Firebase (from Firebase Console → Project Settings → Your apps)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

See `.env.example` for the full reference including Google OAuth client IDs.

### Physical device tip

When testing on a real device over Wi-Fi, replace `localhost` with your machine's LAN IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:4000
```

## Running locally

```bash
npm install
npm start       # Expo Dev Server
```

Then press:
- `a` — Android emulator
- `i` — iOS simulator
- Scan QR with Expo Go on a physical device

## Building with EAS

```bash
# Preview APK (internal testing)
npm run build:android:apk

# Production AAB (Play Store)
npm run build:android:prod

# iOS (requires Apple Developer account)
npm run build:ios
```

## OTA updates

```bash
# Push update to the preview channel
npm run update:preview

# Push update to production
npm run update:production
```
