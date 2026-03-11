import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

const initialState = {
  dashboard: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    adminRequestStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    adminRequestFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setAdminDashboard: (state, action) => {
      state.loading = false;
      state.dashboard = action.payload;
      state.error = null;
    },
    clearAdminState: (state) => {
      state.dashboard = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { adminRequestStart, adminRequestFailure, setAdminDashboard, clearAdminState } =
  adminSlice.actions;

export const fetchAdminDashboard = () => async (dispatch) => {
  dispatch(adminRequestStart());
  try {
    const dashboard = await api.getAdminDashboard();
    dispatch(setAdminDashboard(dashboard));
    return dashboard;
  } catch (error) {
    dispatch(adminRequestFailure(error.message || "Unable to load admin dashboard"));
    throw error;
  }
};

export default adminSlice.reducer;
