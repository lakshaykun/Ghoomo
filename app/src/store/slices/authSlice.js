
import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, clearApiAuthToken, setApiAuthToken } from "../../services/api";

const AUTH_STORAGE_KEY = "ghoomo.auth.user";
const APP_ADMIN_ROLE_BLOCK_MESSAGE = "Admin accounts are not supported in the mobile app. Please use the admin website.";
const GOOGLE_LOGIN_NOT_AVAILABLE_MESSAGE =
  "Google sign-in is temporarily unavailable because the modular backend does not implement social login endpoints yet.";

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "rider" || normalized === "user") return "user";
  if (normalized === "bus_driver") return "bus_driver";
  return normalized || "user";
}

function normalizeDriverVehicleType(vehicleType) {
  const normalized = String(vehicleType || "").trim().toLowerCase();
  return normalized === "cab" ? "cab" : "auto";
}

function persistSessionPayload({ user, token, authMethod }) {
  return {
    ...user,
    token,
    authMethod,
  };
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  hydrated: false,
  authMethod: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => { state.loading = true; state.error = null; },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = Boolean(action.payload.user && action.payload.token);
      state.authMethod = action.payload.authMethod;
      state.error = null;
      state.hydrated = true;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.hydrated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.hydrated = true;
      state.authMethod = null;
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    restoreSession: (state, action) => {
      const session = action.payload;
      state.user = session?.user ? { ...session.user } : null;
      state.token = session?.token || null;
      state.authMethod = session?.authMethod || null;
      state.isAuthenticated = Boolean(session?.user && session?.token);
      state.loading = false;
      state.error = null;
      state.hydrated = true;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateProfile, restoreSession } = authSlice.actions;

export const loginUser = (email, password) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const { user, token } = await api.login(email, password, { timeoutMs: 12000 });
    const normalizedUser = {
      ...user,
      role: normalizeRole(user?.role),
    };

    if (normalizedUser.role === "admin") {
      throw new Error(APP_ADMIN_ROLE_BLOCK_MESSAGE);
    }

    setApiAuthToken(token);

    dispatch(loginSuccess({ user: normalizedUser, token, authMethod: "password" }));

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(persistSessionPayload({ user: normalizedUser, token, authMethod: "password" }))
    );
  } catch (error) {
    clearApiAuthToken();
    dispatch(loginFailure(error.message || "Unable to sign in"));
  }
};

export const registerUser = (userData) => async (dispatch) => {
  dispatch(loginStart());
  try {
    if (userData.role === "admin") {
      throw new Error(APP_ADMIN_ROLE_BLOCK_MESSAGE);
    }

    const { user, token } = await api.register({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: "user",
    });

    setApiAuthToken(token);

    const normalizedUser = {
      ...user,
      role: normalizeRole(user?.role),
    };

    if (userData.role === "driver") {
      const vehicleNumber = String(userData.vehicleNo || userData.vehicleNumber || "").trim();
      if (!vehicleNumber) {
        throw new Error("Vehicle number is required for driver registration");
      }

      const vehicleType = normalizeDriverVehicleType(userData.vehicleType);
      const driverRes = await api.registerDriverProfile({
        vehicleNumber,
        vehicleType,
      });

      const finalUser = driverRes.user;
      const finalToken = driverRes.token;

      setApiAuthToken(finalToken);

      dispatch(loginSuccess({ user: finalUser, token: finalToken, authMethod: "password" }));

      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(persistSessionPayload({ user: finalUser, token: finalToken, authMethod: "password" }))
      );
      return;
    }

    dispatch(loginSuccess({ user: normalizedUser, token, authMethod: "password" }));

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(persistSessionPayload({ user: normalizedUser, token, authMethod: "password" }))
    );
  } catch (error) {
    clearApiAuthToken();
    dispatch(loginFailure(error.message || "Unable to register"));
  }
};

/**
 * Google sign-in/sign-up
 */
export const googleSignIn = (promptAsync, selectedRole = "user") => async (dispatch) => {
  dispatch(loginStart());
  void promptAsync;
  void selectedRole;
  dispatch(loginFailure(GOOGLE_LOGIN_NOT_AVAILABLE_MESSAGE));
};

export const logoutUser = () => async (dispatch) => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  clearApiAuthToken();
  dispatch(logout());
};

export const hydrateAuthSession = () => async (dispatch) => {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;

    if (parsed?.token && parsed?.id) {
      const sessionUser = {
        ...parsed,
      };

      delete sessionUser.token;
      delete sessionUser.authMethod;

      setApiAuthToken(parsed.token);
      dispatch(
        restoreSession({
          user: sessionUser,
          token: parsed.token,
          authMethod: parsed.authMethod || "password",
        })
      );
      return;
    }

    clearApiAuthToken();
    dispatch(restoreSession(null));
  } catch (_error) {
    clearApiAuthToken();
    dispatch(restoreSession(null));
  }
};

export default authSlice.reducer;
