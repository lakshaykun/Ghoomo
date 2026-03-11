import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { BOOKING_STATUS } from "../../constants";
import { sendLocalNotification } from "../../services/notifications";

const initialState = {
  dashboard: null,
  loading: false,
  error: null,
};

const driverSlice = createSlice({
  name: "driver",
  initialState,
  reducers: {
    driverRequestStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    driverRequestFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setDriverDashboard: (state, action) => {
      state.loading = false;
      state.dashboard = action.payload;
      state.error = null;
    },
    setDriverOnlineState: (state, action) => {
      if (!state.dashboard) {
        state.dashboard = {
          driver: null,
          online: Boolean(action.payload),
          location: null,
          activeRide: null,
          assignedRides: [],
          stats: {
            ridesToday: 0,
            todayEarnings: 0,
            rating: 0,
          },
        };
      } else {
        state.dashboard.online = Boolean(action.payload);
      }
    },
    clearDriverState: (state) => {
      state.dashboard = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { driverRequestStart, driverRequestFailure, setDriverDashboard, setDriverOnlineState, clearDriverState } =
  driverSlice.actions;

export const fetchDriverDashboard = (driverId) => async (dispatch, getState) => {
  dispatch(driverRequestStart());
  try {
    const previousDashboard = getState().driver.dashboard;
    const dashboard = await api.getDriverDashboard(driverId);
    const previousActiveRide = previousDashboard?.activeRide;
    const nextActiveRide = dashboard?.activeRide;

    if (nextActiveRide && nextActiveRide.id !== previousActiveRide?.id) {
      await sendLocalNotification({
        key: `driver-assigned-${nextActiveRide.id}`,
        title: "New ride assigned",
        body: `${nextActiveRide.pickup?.name || "Pickup"} to ${nextActiveRide.drop?.name || "Drop"} is ready for you.`,
        data: { rideId: nextActiveRide.id, role: "driver" },
      });
    }

    if (
      previousActiveRide?.id === nextActiveRide?.id &&
      previousActiveRide?.status !== nextActiveRide?.status &&
      nextActiveRide?.status
    ) {
      const statusMessage =
        nextActiveRide.status === BOOKING_STATUS.IN_PROGRESS
          ? "Ride started successfully."
          : nextActiveRide.status === BOOKING_STATUS.COMPLETED
            ? "Ride completed and marked closed."
            : "Ride status changed.";
      await sendLocalNotification({
        key: `driver-status-${nextActiveRide.id}-${nextActiveRide.status}`,
        title: "Trip updated",
        body: statusMessage,
        data: { rideId: nextActiveRide.id, status: nextActiveRide.status, role: "driver" },
      });
    }

    dispatch(setDriverDashboard(dashboard));
    return dashboard;
  } catch (error) {
    dispatch(driverRequestFailure(error.message || "Unable to load driver dashboard"));
    throw error;
  }
};

export const toggleDriverOnline = (driverId, online) => async (dispatch) => {
  dispatch(setDriverOnlineState(online));
  dispatch(driverRequestStart());
  try {
    await api.setDriverOnline(driverId, online);
    const dashboard = await api.getDriverDashboard(driverId);
    await sendLocalNotification({
      key: `driver-online-${driverId}-${online ? "on" : "off"}`,
      title: online ? "You are online" : "You are offline",
      body: online ? "Nearby riders can now be assigned to you." : "Ride requests are paused until you go online again.",
      data: { driverId, online },
    });
    dispatch(setDriverDashboard(dashboard));
    return dashboard;
  } catch (error) {
    dispatch(setDriverOnlineState(!online));
    dispatch(driverRequestFailure(error.message || "Unable to update driver status"));
    throw error;
  }
};

export const updateDriverLocation = (driverId, location) => async (dispatch) => {
  try {
    const dashboard = await api.updateDriverLocation(driverId, location);
    dispatch(setDriverDashboard(dashboard));
    return dashboard;
  } catch (error) {
    dispatch(driverRequestFailure(error.message || "Unable to update location"));
    throw error;
  }
};

export const driverUpdateRideStatus = (driverId, rideId, status, extra = {}) => async (dispatch) => {
  dispatch(driverRequestStart());
  try {
    await api.updateRideStatus(rideId, status, extra);
    const dashboard = await api.getDriverDashboard(driverId);
    if (status === BOOKING_STATUS.IN_PROGRESS) {
      await sendLocalNotification({
        key: `driver-status-${rideId}-${status}`,
        title: "Ride started",
        body: "OTP verified. Trip is now in progress.",
        data: { rideId, status, role: "driver" },
      });
    }
    if (status === BOOKING_STATUS.COMPLETED) {
      await sendLocalNotification({
        key: `driver-status-${rideId}-${status}`,
        title: "Ride completed",
        body: "This trip has been marked completed.",
        data: { rideId, status, role: "driver" },
      });
    }
    dispatch(setDriverDashboard(dashboard));
    return dashboard;
  } catch (error) {
    dispatch(driverRequestFailure(error.message || "Unable to update ride"));
    throw error;
  }
};

export default driverSlice.reducer;
