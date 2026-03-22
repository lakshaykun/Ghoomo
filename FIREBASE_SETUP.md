# Google Firebase Authentication Setup Guide

This guide will help you set up Google authentication with Firebase for the Ghoomo app.

## Prerequisites
- A Google Cloud project
- A Firebase project
- Access to Google Cloud Console and Firebase Console

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "Ghoomo")
4. Complete the setup process
5. Select your project once created

## Step 2: Enable Google Sign-In in Firebase

1. In Firebase Console, go to **Authentication**
2. Click on the **Sign-in method** tab
3. Enable **Google** sign-in
4. Accept the terms and save

## Step 3: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure your Ghoomo project is selected (top-left dropdown)
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Select **External** for user type
5. Fill in the required information:
   - App name: Ghoomo
   - User support email: Your email
   - Developer contact: Your email
6. Click **Save and Continue**
7. On the **Scopes** page, click **Save and Continue**
8. On the **Summary** page, click **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials (for mobile app)

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Android** as application type
4. For Android configuration, you'll need to add:
   - Your app's package name (e.g., `com.ghoomo.app`)
   - Your app's signing certificate (SHA-1 fingerprint)

### How to get your Android SHA-1 Fingerprint:

If you're using Expo:
```bash
# For Expo projects, use this command:
openssl pkcs12 -in your-keystore.p12 -nodesout | openssl x509 -noout -fingerprint
```

Or if you don't have a keystore yet, Expo will generate one during build.

## Step 5: Create Web OAuth Credentials (for development)

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add Authorized redirect URIs:
   ```
   http://localhost:3000
   http://localhost:19000
   exp://localhost:19000
   ```
5. Copy your Client ID and Client Secret (save these!)

## Step 6: Get Your Firebase Configuration

1. In Firebase Console, go to **Project Overview** > **Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on **Web** app (or create one if needed)
4. Copy the Firebase configuration object

## Step 7: Configure Environment Variables

Create a `.env` file in your project root with these variables:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth Configuration (Web Client)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Finding these values:

**Firebase Config** - Available in Firebase Console > Project Settings > Your Apps > Web:
```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```

**Google Client ID** - Available in Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs

## Step 8: Install Dependencies

All required dependencies are already in `package.json`:
- `firebase` - Firebase SDK
- `expo-auth-session` - Expo OAuth handling
- `expo-web-browser` - For OAuth flow

These are already installed. Just ensure your dependencies are up to date:

```bash
npm install
# or
yarn install
```

## Step 9: Enable Firestore (Optional but recommended)

For storing user roles and additional profile information:

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your region and create

### Firestore Rules (for development):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if request.auth.uid != null;
    }
  }
}
```

## Step 10: Test Your Setup

1. Start your Expo development server:
   ```bash
   npm run start
   ```

2. On the login/signup screen, click "Sign in with Google" or "Sign up with Google"

3. Select your Google account

4. If successful, you should be authenticated!

## Troubleshooting

### Issue: Google Sign-In not working
- Check that your `.env` variables are correctly set
- Ensure your app is using the correct Client ID from Google Cloud
- Verify Google Sign-In is enabled in Firebase Console

### Issue: "Invalid client" error
- Your `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is incorrect or malformed
- The Client ID should be in format: `xxxxxxxxxxxx.apps.googleusercontent.com`

### Issue: User data not syncing
- Check Firebase connection in `src/services/firebaseConfig.js`
- Verify Firestore rules allow read/write for your users
- Check browser console and device logs for errors

### Issue: Role not being saved
- Ensure Firestore is enabled
- Check that user document is being created in Firestore
- Verify Firestore rules allow the user to write to their own document

## Production Deployment

For production, you'll need to:

1. **Android**: Use your production signing certificate SHA-1
2. **iOS**: Register your app and add signing certificate
3. **Update OAuth Consent Screen**: Change from "External" to "Internal" if only for company
4. **Add Production Redirect URIs**: Update authorized redirect URIs for your production domain
5. **Enable Google Analytics**: Optional, but recommended for production

## Firebase Security Rules (Production)

Update Firestore rules for production:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow create: if request.auth.uid == uid;
      allow read: if request.auth.uid == uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update, delete: if request.auth.uid == uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## User Roles

When signing up with Google or email, users can select their role:

- **User**: Passengers who book rides and bus seats
- **Driver**: Can offer rides (bike, auto, cab, bus)
- **Admin**: Platform administrators with management access

Roles are stored in both:
1. **Firestore**: `/users/{uid}` document
2. **Backend**: Local storage in `data/store.json`

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Expo Auth Session Docs](https://docs.expo.dev/guides/authentication/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
