import { httpClient } from "../core/httpClient";
import { normalizeSavedLocation } from "./mappers";

export async function getSavedLocations() {
  const rows = await httpClient.get("/api/users/saved-locations");
  const locations = Array.isArray(rows) ? rows.map((row) => normalizeSavedLocation(row)) : [];
  return { locations };
}

export async function addSavedLocation(payload = {}) {
  const row = await httpClient.post("/api/users/saved-locations", {
    body: {
      name: payload.name,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
    },
  });

  return { location: normalizeSavedLocation(row) };
}

export async function removeSavedLocation(locationId) {
  await httpClient.delete(`/api/users/saved-locations/${locationId}`);
  return { success: true };
}
