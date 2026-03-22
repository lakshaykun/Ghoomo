import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { sendLocalNotification } from "../../services/notifications";

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

async function notifySharedRideUpdates(previousMyRequests = [], nextMyRequests = []) {
  const previousMap = new Map(previousMyRequests.map((request) => [request.id, request]));

  for (const request of nextMyRequests) {
    const previous = previousMap.get(request.id);

    if (!previous) {
      await sendLocalNotification({
        key: `shared-ride-live-${request.id}`,
        title: "Shared ride request posted",
        body: `Your shared ${request.rideType} request is now visible to nearby riders.`,
        data: { sharedRideRequestId: request.id, rideId: request.rideId, role: "user" },
      });
      continue;
    }

    const previousCount = Number(previous.acceptedCount || 0);
    const nextCount = Number(request.acceptedCount || 0);
    if (nextCount > previousCount) {
      const joinedNow = nextCount - previousCount;
      await sendLocalNotification({
        key: `shared-ride-join-${request.id}-${nextCount}`,
        title: joinedNow === 1 ? "Co-rider joined" : "Co-riders joined",
        body: `${nextCount}/${request.requestedSeats} joined your shared ride request.`,
        data: { sharedRideRequestId: request.id, rideId: request.rideId, role: "user" },
      });
    }
  }
}

export const fetchSharedRides = (userId) => async (dispatch, getState) => {
  dispatch(sharedRequestStart());
  try {
    const previousMyRequests = getState().sharedRides.myRequests || [];
    const payload = await api.getSharedRides(userId);
    dispatch(setSharedRides(payload));
    await notifySharedRideUpdates(previousMyRequests, payload.myRequests || []);
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
