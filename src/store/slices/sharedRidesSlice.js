import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

const initialState = {
  requests: [],
  myRequests: [],
  availableRequests: [],
  loading: false,
  error: null,
};

const sharedRidesSlice = createSlice({
  name: "sharedRides",
  initialState,
  reducers: {
    sharedRequestStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    sharedRequestFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSharedRides: (state, action) => {
      state.loading = false;
      state.requests = action.payload.requests || [];
      state.myRequests = action.payload.myRequests || [];
      state.availableRequests = action.payload.availableRequests || [];
      state.error = null;
    },
    clearSharedRides: (state) => {
      state.requests = [];
      state.myRequests = [];
      state.availableRequests = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const { sharedRequestStart, sharedRequestFailure, setSharedRides, clearSharedRides } = sharedRidesSlice.actions;

export const fetchSharedRides = (userId) => async (dispatch) => {
  dispatch(sharedRequestStart());
  try {
    const payload = await api.getSharedRides(userId);
    dispatch(setSharedRides(payload));
    return payload;
  } catch (error) {
    dispatch(sharedRequestFailure(error.message || "Unable to load shared rides"));
    throw error;
  }
};

export const joinSharedRideRequest = (requestId, userId) => async (dispatch) => {
  try {
    await api.joinSharedRide(requestId, userId);
    const payload = await api.getSharedRides(userId);
    dispatch(setSharedRides(payload));
    return payload;
  } catch (error) {
    dispatch(sharedRequestFailure(error.message || "Unable to join shared ride"));
    throw error;
  }
};

export const stopSharedRideRequest = (requestId, userId) => async (dispatch) => {
  try {
    await api.closeSharedRide(requestId, userId);
    const payload = await api.getSharedRides(userId);
    dispatch(setSharedRides(payload));
    return payload;
  } catch (error) {
    dispatch(sharedRequestFailure(error.message || "Unable to stop shared ride"));
    throw error;
  }
};

export default sharedRidesSlice.reducer;
