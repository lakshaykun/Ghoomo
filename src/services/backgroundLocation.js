import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { api } from "./api";
import { store } from "../store";

const DRIVER_LOCATION_TASK = "ghoomo-driver-background-location";

TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;

  const locations = data?.locations || [];
  const latestLocation = locations[locations.length - 1];
  const authState = store.getState().auth;
  const driverId = authState.user?.role === "driver" ? authState.user.id : null;

  if (!driverId || !latestLocation?.coords) return;

  try {
    await api.updateDriverLocation(driverId, {
      latitude: latestLocation.coords.latitude,
      longitude: latestLocation.coords.longitude,
    });
  } catch (_error) {
    // Foreground polling recovers if a background sync fails.
  }
});

export async function ensureDriverBackgroundLocation() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    throw new Error("Foreground location permission is required for live driver tracking.");
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") {
    throw new Error("Background location permission is required to share driver location when the app is closed.");
  }

  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (started) return true;

  await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 25,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Ghoomo driver tracking active",
      notificationBody: "Your live location is being shared for assigned rides.",
      notificationColor: "#6C63FF",
    },
  });

  return true;
}

export async function stopDriverBackgroundLocation() {
  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (!started) return;
  await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
}

export { DRIVER_LOCATION_TASK };
