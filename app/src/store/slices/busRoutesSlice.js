import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

const FALLBACK_DEPARTURE_TIME = "12:00 PM";

function normalizeBusRoute(route = {}) {
  const bookedSeats = Array.isArray(route.bookedSeats)
    ? route.bookedSeats.filter((seat) => Number.isFinite(Number(seat))).map((seat) => Number(seat))
    : [];

  return {
    ...route,
    id: route.id || `route_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: typeof route.name === "string" && route.name.trim() ? route.name : "Unnamed Route",
    from: typeof route.from === "string" ? route.from : "",
    to: typeof route.to === "string" ? route.to : "",
    departureTime:
      typeof route.departureTime === "string" && route.departureTime.trim()
        ? route.departureTime
        : FALLBACK_DEPARTURE_TIME,
    stops: Array.isArray(route.stops) ? route.stops.filter((stop) => typeof stop === "string" && stop.trim()) : [],
    totalSeats: Number.isFinite(Number(route.totalSeats)) && Number(route.totalSeats) > 0
      ? Number(route.totalSeats)
      : 40,
    bookedSeats,
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
