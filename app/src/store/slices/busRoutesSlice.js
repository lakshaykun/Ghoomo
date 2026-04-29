import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

function normalizeBusRoute(route = {}) {
  const stopsDetailed = Array.isArray(route.stops) ? route.stops : [];
  const stopNames = stopsDetailed
    .map((stop) => stop?.stopName || stop?.name || "")
    .filter(Boolean);

  return {
    ...route,
    id: route.id || null,
    name: typeof route.name === "string" && route.name.trim() ? route.name : "Unnamed Route",
    from: route.from || stopNames[0] || "",
    to: route.to || stopNames[stopNames.length - 1] || "",
    departureTime: route.departureTime || route.departure_time || null,
    driverUserId: route.driverUserId || route.driver_user_id || null,
    driverName: route.driverName || route.driver_name || null,
    stops: stopNames,
    stopsDetailed,
    totalSeats: Number.isFinite(Number(route.totalSeats || route.total_seats)) 
      ? Number(route.totalSeats || route.total_seats) 
      : null,
    farePerSeat: Number(route.farePerSeat || route.fare_per_seat || 0),
  };
}

function normalizeBusRoutes(routes) {
  return Array.isArray(routes) ? routes.map((route) => normalizeBusRoute(route)) : [];
}

const initialState = {
  routes: [],
  loading: false,
  creating: false,
  error: null,
};

const busRoutesSlice = createSlice({
  name: "busRoutes",
  initialState,
  reducers: {
    routesRequestStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    routesRequestFailure: (state, action) => {
      state.loading = false;
      state.creating = false;
      state.error = action.payload;
    },
    setBusRoutes: (state, action) => {
      state.loading = false;
      state.creating = false;
      state.routes = normalizeBusRoutes(action.payload);
      state.error = null;
    },
    routeCreateStart: (state) => {
      state.creating = true;
      state.error = null;
    },
  },
});

export const { routesRequestStart, routesRequestFailure, setBusRoutes, routeCreateStart } =
  busRoutesSlice.actions;

export const fetchBusRoutes = () => async (dispatch) => {
  dispatch(routesRequestStart());
  try {
    const { routes } = await api.getBusRoutes();
    const normalizedRoutes = normalizeBusRoutes(routes);
    dispatch(setBusRoutes(normalizedRoutes));
    return normalizedRoutes;
  } catch (error) {
    dispatch(routesRequestFailure(error.message || "Unable to load bus routes"));
    throw error;
  }
};

export const createBusRoute = (payload) => async (dispatch) => {
  dispatch(routeCreateStart());
  try {
    const { routes } = await api.createBusRoute(payload);
    const normalizedRoutes = normalizeBusRoutes(routes);
    dispatch(setBusRoutes(normalizedRoutes));
    return normalizedRoutes;
  } catch (error) {
    dispatch(routesRequestFailure(error.message || "Unable to create bus route"));
    throw error;
  }
};

export default busRoutesSlice.reducer;
