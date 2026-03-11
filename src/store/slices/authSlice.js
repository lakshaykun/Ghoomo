
import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";
import { registerPushTokenForUser, unregisterPushTokenForUser } from "../../services/notifications";

const AUTH_STORAGE_KEY = "ghoomo.auth.user";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => { state.loading = true; state.error = null; },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
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
      state.isAuthenticated = false;
      state.error = null;
      state.hydrated = true;
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    restoreSession: (state, action) => {
      state.user = action.payload || null;
      state.isAuthenticated = Boolean(action.payload);
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
    const { user } = await api.login(email, password);
    dispatch(loginSuccess(user));
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    await registerPushTokenForUser(user.id);
  } catch (error) {
    dispatch(loginFailure(error.message || "Unable to sign in"));
  }
};

export const registerUser = (userData) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const { user } = await api.register(userData);
    dispatch(loginSuccess(user));
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    await registerPushTokenForUser(user.id);
  } catch (error) {
    dispatch(loginFailure(error.message || "Unable to register"));
  }
};

export const logoutUser = () => async (dispatch, getState) => {
  const userId = getState().auth.user?.id;
  await unregisterPushTokenForUser(userId);
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  dispatch(logout());
};

export const hydrateAuthSession = () => async (dispatch) => {
  try {
    const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    dispatch(restoreSession(parsedUser));
    if (parsedUser?.id) {
      await registerPushTokenForUser(parsedUser.id);
    }
  } catch (_error) {
    dispatch(restoreSession(null));
  }
};

export default authSlice.reducer;
