import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

const initialState = {
  routes: [],
  loading: false,
  error: null,
};

const busRoutesSlice = createSlice({
  name: "busRoutes",
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess: (state, action) => {
      state.loading = false;
      state.routes = Array.isArray(action.payload) ? action.payload : [];
      state.error = null;
    },
    fetchFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setRoutes: (state, action) => {
      state.routes = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const { fetchStart, fetchSuccess, fetchFailure, setRoutes } =
  busRoutesSlice.actions;

export const fetchBusRoutes = () => async (dispatch) => {
  dispatch(fetchStart());
  try {
    const { routes } = await api.getBusRoutes();
    dispatch(fetchSuccess(routes));
    return routes;
  } catch (error) {
    dispatch(fetchFailure(error.message || "Unable to load bus routes"));
  }
};

export default busRoutesSlice.reducer;
