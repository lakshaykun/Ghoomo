# Ghoomo Platform - Project Root README

## 📁 Project Structure

This is a **monorepo** containing three main modules:

```
ghoomo-platform/
├── app/                  # Mobile app (React Native / Expo)
│   ├── src/             # Source code
│   ├── android/         # Android native project
│   ├── ios/             # iOS native project
│   ├── package.json     # App dependencies
│   └── eas.json         # Expo build configuration
├── backend/             # API server (Node.js / Express)
│   ├── src/             # Source code
│   ├── package.json     # Backend dependencies
│   └── server.js        # Entry point
├── web/                 # Admin dashboard (HTML/CSS/JS)
│   ├── index.html       # Main dashboard UI
│   ├── app.js           # Dashboard logic
│   ├── styles.css       # Styling
│   └── package.json     # Web build tools
└── package.json         # Root monorepo config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0+ and **npm** 9.0+
- **Android Studio** (for Android development)
- **Xcode** (for iOS development)
- **PostgreSQL** (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ghoomo/platform.git
   cd platform
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   **Backend** (`backend/.env`):
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and API keys
   ```

   **Mobile App** (`app/.env`):
   - Firebase credentials
   - Google OAuth configuration
   - Backend API URL

   **Web Admin** (`web/.env`):
   ```bash
   cp web/.env.example web/.env
   # Default: API_URL=http://localhost:4000/api
   ```

### Running the Project

**Option 1: Run all services together**
```bash
npm run start:all
```

**Option 2: Run services separately**

Terminal 1 - Backend API:
```bash
npm run start:backend
# API server running at http://localhost:4000
```

Terminal 2 - Mobile App:
```bash
npm run start:app
# Expo dev server will start
# Press 'a' for Android, 'i' for iOS
```

Terminal 3 - Admin Web Dashboard:
```bash
npm run start:web
# Web admin dashboard at http://localhost:8080
```

## 📱 Module Details

### App Module (`/app`)

**React Native mobile application** using Expo for users and drivers.

**Features:**
- User/Driver authentication (Email + Google OAuth)
- Real-time ride booking
- Live driver tracking
- QR code verification
- Push notifications
- Firebase integration

**Tech Stack:**
- React Native 0.81
- Expo 54
- Redux Toolkit for state management
- React Navigation
- Firebase Auth
- Location services

**Scripts:**
```bash
npm start              # Expo dev server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run build:android  # Build APK for distribution
```

### Backend Module (`/backend`)

**Node.js Express API server** providing all platform endpoints.

**Key Features:**
- REST API for users, drivers, rides, and admin
- Real-time WebSocket connections
- JWT authentication
- Role-based access control (user/driver/admin)
- Supabase PostgreSQL database
- Admin dashboard endpoints

**Tech Stack:**
- Node.js + Express
- PostgreSQL (Supabase)
- WebSocket (ws)
- JWT authentication
- Render.com deployment

**Scripts:**
```bash
npm start      # Start API server on port 4000
npm run seed   # Seed test data
```

**API Endpoints:**
- `POST /api/auth/login` - User/Driver login
- `POST /api/auth/register` - User/Driver registration
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/rides` - Get available rides
- `POST /api/rides/book` - Book a ride
- WebSocket `/ws` - Real-time updates

### Web Module (`/web`)

**Admin dashboard** for platform monitoring and management.

**Features:**
- Real-time metrics dashboard
- Bookings management
- Driver management
- User management
- Route management
- Auto-refresh every 30 seconds
- Session persistence

**Tech Stack:**
- Vanilla HTML/CSS/JavaScript
- Fetch API
- LocalStorage for sessions
- No external dependencies (lightweight)

**Scripts:**
```bash
npm run serve   # Start dev server on port 8080
npm run build   # Static asset bundling
```

**Access:**
- URL: `http://localhost:8080`
- Login with admin credentials
- Auto-refresh: 30 seconds

## 🔧 Configuration Files

### Root Level (`package.json`)

Monorepo workspace configuration:
- Workspace definitions for `app`, `backend`, `web`
- Scripts for running all services
- Common dev dependencies (ESLint, Prettier, Concurrently)

### App Level

- `app/package.json` - Expo dependencies
- `app/eas.json` - Expo build configuration
- `app/app.json` - Expo app configuration
- `app/tsconfig.json` - TypeScript configuration
- `app/babel.config.js` - Babel configuration

### Backend Level

- `backend/package.json` - Express dependencies
- `backend/.env` - Environment secrets
- `backend/server.js` - Express server entry point

### Web Level

- `web/package.json` - Web build tools
- `web/.env` - API configuration
- `web/index.html` - Dashboard HTML
- `web/app.js` - Dashboard logic
- `web/styles.css` - Dashboard styling

## 📝 Environment Configuration

### Backend Environment Variables

```bash
# Server
NODE_ENV=development
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ghoomo
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Third-party
FIREBASE_PROJECT_ID=ghoomo-b0ffb
GOOGLE_MAPS_API_KEY=your_key
```

### Mobile App Environment Variables

```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...

# API
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Web Admin Environment Variables

```bash
# API
REACT_APP_API_URL=http://localhost:4000/api

# Configuration
REACT_APP_AUTO_REFRESH_INTERVAL=30000
```

## 🏗️ Building for Production

### Mobile App - Android

```bash
cd app
npm run build:android:prod
# APK will be available at build completion
# Use Expo EAS for cloud builds
```

### Mobile App - iOS

```bash
cd app
npm run build:ios
# Uses EAS cloud builds
```

### Backend

```bash
cd backend
npm run build
# Deploy to Render, Heroku, or your hosting
```

### Web Admin

Deploy `/web` folder to any static host:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Nginx

## 🔐 API Authentication

### User Roles

1. **User** - Ride passenger
2. **Driver** - Ride provider
3. **Admin** - Platform management (Web only)

### Authentication Flow

1. User registers/logs in via mobile or web
2. Backend returns JWT token
3. Token stored in localStorage (web) or AsyncStorage (mobile)
4. Subsequent requests include token in Authorization header
5. Mobile app prevents admin login (admin-only for web)

## 📊 Project Statistics

- **Mobile App**: ~5000 lines of React Native code
- **Backend**: ~2000 lines of Express + DB logic
- **Web Admin**: ~1500 lines of vanilla JS
- **Total**: ~8500 lines of application code

## 🐛 Common Issues

### Backend not starting
```bash
# Check database connection
curl http://localhost:4000/api/health

# Check logs
npm start --prefix backend
```

### Mobile app can't connect to backend
- Check backend is running: `http://localhost:4000`
- Update `EXPO_PUBLIC_API_BASE_URL` in `app/.env`
- For physical devices: use actual IP instead of localhost

### Web admin won't load
- Verify backend API is running
- Check browser console for CORS errors
- Update `REACT_APP_API_URL` in `web/.env`

## 📚 Additional Documentation

- [Backend API Documentation](./backend/API_DOCUMENTATION.md)
- [Mobile App Authentication](./app/src/services/firebaseAuth.js)
- [Admin Web Dashboard Guide](./web/README.md)
- [Authentication Reference](./docs/AUTH_QUICK_REFERENCE.md)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Submit pull request

## 📄 License

This project is licensed under MIT License - see [LICENSE](./LICENSE) for details.

## 📞 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact: support@ghoomo.com
- Documentation: https://docs.ghoomo.com

---

**Last Updated**: 2024
**Version**: 1.0.0
