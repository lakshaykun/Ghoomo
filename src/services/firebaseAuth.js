// Firebase Authentication Service
import {
  signInWithCredential,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

// Set up web browser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration - configure platform-specific IDs in .env
const legacyClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || legacyClientId;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || legacyClientId;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || legacyClientId;
const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || legacyClientId;

// Must be called directly in component body (it is a React hook).
export function useGoogleAuthRequest() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
    expoClientId,
    scopes: ["profile", "email"],
  });

  return { request, response, promptAsync };
}

/**
 * Sign up user with email and password
 */
export async function signUpWithEmail(email, password, displayName, role = "user") {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: displayName,
      photoURL: null,
    });

    // Create user document in Firestore with role and profile info
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: role, // user, driver, admin
      authMethod: "email",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoURL: null,
      phone: null,
      city: null,
      isActive: true,
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sign in user with email and password
 */
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : { role: "user" };

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData.role || "user",
        photoURL: user.photoURL,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sign in with Google
 */
export async function handleGoogleSignIn(promptAsync, selectedRole = "user") {
  try {
    if (!promptAsync) {
      throw new Error("Google auth not initialized");
    }

    // Prompt user to select Google account
    const result = await promptAsync();

    if (result?.type !== "success") {
      return {
        success: false,
        error: "Google sign-in was cancelled",
      };
    }

    // Get the id token from Google
    const { id_token } = result.params;

    // Create credential
    const credential = GoogleAuthProvider.credential(id_token);

    // Sign in with Firebase
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // New user - create document with selected role
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: selectedRole,
        authMethod: "google",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoURL: user.photoURL,
        phone: null,
        city: null,
        isActive: true,
      });
    } else {
      // Existing user - update last login
      await updateDoc(doc(db, "users", user.uid), {
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    }

    // Get user role
    const finalUserDoc = await getDoc(doc(db, "users", user.uid));
    const userData = finalUserDoc.data();

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData.role,
        photoURL: user.photoURL,
        authMethod: userData.authMethod,
      },
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get idToken for backend verification
 */
export async function getFirebaseToken() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: "No user signed in",
      };
    }
    const token = await currentUser.getIdToken();
    return {
      success: true,
      token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId, newRole) {
  try {
    await updateDoc(doc(db, "users", userId), {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user profile with role
 */
export async function getUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return {
        success: true,
        user: userDoc.data(),
      };
    } else {
      return {
        success: false,
        error: "User not found",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid, profileData) {
  try {
    await updateDoc(doc(db, "users", uid), {
      ...profileData,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  return auth.onAuthStateChanged(callback);
}
