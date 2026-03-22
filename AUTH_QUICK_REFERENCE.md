# Quick Reference: Google Firebase Authentication

## 🚀 Quick Start

### 1. Set Up Firebase Project
- Visit [Firebase Console](https://console.firebase.google.com/)
- Create new project "Ghoomo"
- Enable Google Sign-In in Authentication > Sign-in method
- Copy credentials to `.env` file

### 2. Add Environment Variables
```bash
cp .env.example .env
# Edit .env with your Firebase and Google credentials
```

### 3. Run the App
```bash
npm install
npm run start
```

## 📱 User Authentication Flows

### Email/Password Sign-Up
```
User → Registration Screen → Fill Details + Select Role → 
Firebase Creates Auth + Firestore Profile → Backend Creates User → Logged In
```

### Google Sign-In
```
User → Login Screen → Google Sign-In Button → 
OAuth Prompt → Firebase Auth → Backend Sync → Logged In
```

### Google Sign-Up
```
User → Registration Screen → Google Sign-Up Button → 
Select Role (Modal) → OAuth → Firebase + Firestore → Logged In
```

## 🔐 Role-Based System

| Role | Can Do | Special Fields |
|------|--------|-----------------|
| **User** | Book rides/buses | None |
| **Driver** | Accept rides, earn money | vehicleType, vehicleNo, licenseNumber, rating |
| **Admin** | Manage platform | employeeId, organization |

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/services/firebaseConfig.js` | Firebase initialization |
| `src/services/firebaseAuth.js` | Google/Email authentication |
| `src/store/slices/authSlice.js` | Redux auth state + thunks |
| `src/screens/auth/LoginScreen.js` | Login UI with Google button |
| `src/screens/auth/RegisterScreen.js` | Registration with Google option |
| `backend/server.js` | Backend auth endpoints |

## 🔑 Environment Variables

```bash
# Required for Firebase
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID

# Required for Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID
```

## 💾 Data Storage

### Firestore (User Profiles & Roles)
```
/users/{uid}
├── email
├── displayName
├── role (user|driver|admin)
├── authMethod (email|google)
├── photoURL
└── lastLogin
```

### Backend (Local Store)
```
data/store.json
└── users[]
    ├── id
    ├── firebaseUid (linked)
    ├── email
    ├── role
    └── [driver/admin specific fields]
```

## 🧪 Testing Checklist

- [ ] Email signup with different roles
- [ ] Google sign-in (existing user)
- [ ] Google sign-up (new user with role selection)
- [ ] User profile appears in Firestore
- [ ] User editable profile fields persist
- [ ] Logout clears auth state
- [ ] Backend receives Firebase token
- [ ] Role-based navigation works

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Google Sign-In button not responding | Check `EXPO_PUBLIC_GOOGLE_CLIENT_ID` env var |
| "Invalid client" error | Verify Client ID format: `xxxxx.apps.googleusercontent.com` |
| User role not saving | Ensure Firestore enabled + user doc created |
| "Auth not initialized" | Check `firebaseConfig.js` credentials |
| Login state lost on refresh | Check AsyncStorage persistence in Redux |

## 📱 API Endpoints

### Backend Authentication

**Email Login**
```
POST /api/auth/login
Body: { email, password }
Response: { user: { id, role, ... } }
```

**Email Registration**
```
POST /api/auth/register
Body: { name, email, phone, password, role, ... }
Response: { user: { id, role, ... } }
```

**Google Login/Signup**
```
POST /api/auth/google-login
Body: { firebaseUid, email, displayName, role, photoURL, idToken }
Response: { user: { id, role, ... }, isNewUser }
```

## 🔐 Security Notes

1. **Firebase Rules**: Set appropriate Firestore rules in production
2. **Email Validation**: Consider adding email verification
3. **Role Verification**: Backend should verify role from Firebase token
4. **HTTPS Only**: Always use HTTPS in production for OAuth
5. **Secret Management**: Never commit `.env` file, use environment secrets

## 🚀 Production Checklist

- [ ] Firebase rules updated for production
- [ ] Google OAuth credentials for production added
- [ ] Email verification enabled
- [ ] Password reset flow implemented
- [ ] Error handling & user feedback improved
- [ ] Analytics configured
- [ ] Rate limiting added to auth endpoints
- [ ] HTTPS certificates updated

## 📚 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Implementation Details](./GOOGLE_AUTH_IMPLEMENTATION.md)
- [Firebase Docs](https://firebase.google.com/docs/auth)
- [Expo Auth Session](https://docs.expo.dev/tutorials/authentication/)

## 💡 Tips

- Use `getFirebaseToken()` to get ID token for backend verification
- Call `updateUserRole()` from admin panel to change user roles
- `getUserProfile()` fetches latest role from Firestore
- Google photos automatically synced to user profile
- All auth state persisted in AsyncStorage for quick startup

---

Need help? Check the detailed guides in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) or [GOOGLE_AUTH_IMPLEMENTATION.md](./GOOGLE_AUTH_IMPLEMENTATION.md)
