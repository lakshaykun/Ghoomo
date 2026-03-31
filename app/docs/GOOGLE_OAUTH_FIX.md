# Google OAuth 2.0 Policy Compliance - Fix Guide

## Problem
Getting error: "You can't sign in as this app doesn't comply with Google Auth 2.0 policy"

**Root Cause**: OAuth consent screen is unverified/in development mode

---

## Solution - Step by Step

### Phase 1: Get Android SHA-1 Fingerprint (Required)

1. Open terminal in the project:
   ```bash
   cd "/Users/shivamgoyal/dep project/ghoomo-app/app/android"
   ```

2. Get the SHA-1 fingerprint:
   ```bash
   # For development/debug key
   ./gradlew signingReport
   ```

3. Look for **SHA1** in the output (you'll see multiple, copy the debug one for now)
   ```
   SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
   ```

---

### Phase 2: Update Google Cloud Console

#### **2.1 Register Android OAuth Credential**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **ghoomo-b0ffb**
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Select **Android**
6. Fill in:
   - **Package name**: `com.ghoomo.app`
   - **SHA-1 certificate fingerprint**: Paste from Step 1.3
7. Click **Create**
8. **Copy the Client ID** - you'll need this in Step 4

#### **2.2 Register iOS OAuth Credential** 
1. In Credentials page, click **Create Credentials > OAuth 2.0 Client ID**
2. Select **iOS**
3. Fill in:
   - **Bundle ID**: `com.ghoomo.app`
4. Click **Create**
5. **Copy the Client ID** - you'll need this in Step 4

#### **2.3 Complete OAuth Consent Screen Verification**
1. Navigate to **APIs & Services > OAuth consent screen**
2. Verify user type is currently: `External` (for testing only)
3. Fill in **ALL required fields**:
   - ✅ App name: `Ghoomo`
   - ✅ User support email: Your email
   - ✅ Developer contact: Your email/phone
   - ✅ App logo: Upload company logo
   - ✅ Privacy policy URL: https://yoursite.com/privacy
   - ✅ Terms of service URL: https://yoursite.com/terms
4. Click **Save and Continue**
5. Add scopes:
   - ✅ `userinfo.profile`
   - ✅ `userinfo.email`
6. Click **Save and Continue**
7. Click **Back to Dashboard**
8. **Look for "REQUEST VERIFICATION"** button
   - Click it and follow Google's verification process
   - This typically takes 1-3 business days
   - Until verified, your app is in "test mode"

---

### Phase 3: Update .env File

Edit `/Users/shivamgoyal/dep project/ghoomo-app/app/.env`:

```bash
# Firebase Configuration (keep existing)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAlJE798PC6k6W-GoA4EgzemXVH891Fm6c
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ghoomo-b0ffb.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ghoomo-b0ffb
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ghoomo-b0ffb.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=916434104324
EXPO_PUBLIC_FIREBASE_APP_ID=1:916434104324:web:xxxxxxxxxxxxx

# Google OAuth 2.0 - Platform Specific (ADD/UPDATE these)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=1024739915849-mfbsap813iku307ui69toqo4ljnlo5k3.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1024739915849-mfbsap813iku307ui69toqo4ljnlo5k3.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=PASTE_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=PASTE_IOS_CLIENT_ID_HERE.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=PASTE_EXPO_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Where to get these IDs**:
- `GOOGLE_WEB_CLIENT_ID`: From Google Cloud Console > Credentials (existing)
- `GOOGLE_ANDROID_CLIENT_ID`: From Step 2.1
- `GOOGLE_IOS_CLIENT_ID`: From Step 2.2
- `GOOGLE_EXPO_CLIENT_ID`: Create same as Android for now, or use the web ID

---

### Phase 4: Test Mode vs Production Mode

#### **TESTING (Current - External OAuth Screen)**
✅ You can test with the app as-is  
✅ Add test user emails in Google Cloud Console  
✅ Those test users can sign in  
❌ Other users will see "Google hasn't verified this app"  

**To add test users**:
1. Go to **OAuth consent screen** in Google Cloud Console
2. Scroll to **Test users**
3. Click **Add users**
4. Add your test email addresses
5. Those users can now sign in

#### **PRODUCTION (After Verification)**
✅ All users can sign in  
✅ No "unverified" warnings  
❌ Must submit app for Google verification (takes 1-3 business days)  

**Steps for production**:
1. Complete OAuth consent screen verification (click "Request Verification")
2. Google reviews your app's privacy policy and terms
3. Wait for approval
4. Update consent screen from "External" to "Internal" or leave as "External" with verified status
5. Deploy updated app with production signing key

---

## Checklist

- [ ] Got Android SHA-1 fingerprint from `./gradlew signingReport`
- [ ] Created Android OAuth credential in Google Cloud Console
- [ ] Created iOS OAuth credential in Google Cloud Console  
- [ ] Copied Client IDs and updated `.env` file
- [ ] Completed OAuth consent screen form
- [ ] Added app logo, privacy policy, terms of service
- [ ] Added test user emails (your email address)
- [ ] Restarted Expo app (`npx expo start` after `.env` change)
- [ ] Test sign-in with Google

---

## Immediate Workaround (While Waiting for Verification)

If you need to test now:

1. Add yourself as a **test user** in OAuth consent screen
2. Updates take a few minutes to propagate
3. Try signing in with your test email
4. You should no longer see the policy error

---

## Documentation Files to Update

Once verified, update these files:
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Add verification status section
- [GOOGLE_AUTH_IMPLEMENTATION.md](GOOGLE_AUTH_IMPLEMENTATION.md) - Add troubleshooting
- [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) - Add client ID setup instructions

---

## Future: Backend Security

After authentication works, implement backend token verification:
- Use Firebase Admin SDK to verify ID tokens
- Prevents spoofed authentication attempts
- Currently the backend accepts any data without verification

See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for auth flow details.
