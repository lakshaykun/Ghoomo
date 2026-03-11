import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

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
      state.routes = action.payload;
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
    dispatch(setBusRoutes(routes));
    return routes;
  } catch (error) {
    dispatch(routesRequestFailure(error.message || "Unable to load bus routes"));
    throw error;
  }
};

export const createBusRoute = (payload) => async (dispatch) => {
  dispatch(routeCreateStart());
  try {
    const { routes } = await api.createBusRoute(payload);
    dispatch(setBusRoutes(routes));
    return routes;
  } catch (error) {
    dispatch(routesRequestFailure(error.message || "Unable to create bus route"));
    throw error;
  }
};

export default busRoutesSlice.reducer;
