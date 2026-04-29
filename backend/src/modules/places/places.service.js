const repository = require("./places.repository");

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_LIMIT = 8;

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPlace(row = {}, index = 0) {
  const name = String(row.name || row.display_name || "Location").trim();
  const address = String(row.address || row.display_name || name).trim();
  const latitude = toNumber(row.latitude ?? row.lat, null);
  const longitude = toNumber(row.longitude ?? row.lon, null);
  return {
    id: row.id || String(row.place_id || `${name}-${index}`),
    name,
    address,
    latitude,
    longitude,
  };
}

async function fetchFromOsm(searchText, limit = DEFAULT_LIMIT) {
  const query = new URLSearchParams({
    format: "jsonv2",
    q: searchText,
    limit: String(limit),
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${query.toString()}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "GhoomoBackend/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload.map((item, index) => toPlace(item, index)) : [];
}

async function searchPlaces(searchText, limit = DEFAULT_LIMIT) {
  const normalized = repository.normalizePlaceName(searchText);
  if (normalized.length < 2) return [];

  // Directly fetch from OSM to ensure we only get OSM locations as requested
  const osmResults = await fetchFromOsm(searchText, limit);
  
  // Optionally we can still persist them or check if they exist locally to keep our DB updated
  const persisted = [];
  for (const place of osmResults) {
    if (place.latitude === null || place.longitude === null) continue;
    try {
      const stored = await repository.upsertGlobalPlace(place);
      if (stored) {
        persisted.push(toPlace(stored));
      } else {
        persisted.push(place);
      }
    } catch (err) {
      console.warn("[PlacesService] Failed to upsert place, returning raw OSM result:", err.message);
      persisted.push(place);
    }
  }
  return persisted;
}


module.exports = {
  searchPlaces,
};
