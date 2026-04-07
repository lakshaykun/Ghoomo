const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_TIMEOUT_MS = 12000;

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function nominatimRequest(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const url = `${NOMINATIM_BASE_URL}${path}?${query.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "GhoomoMobile/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed with HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapPlace(item = {}, index = 0) {
  const name = item.display_name || item.name || item.address?.road || "Location";
  const latitude = toNumber(item.lat, null);
  const longitude = toNumber(item.lon, null);

  return {
    id: String(item.place_id || `${name}-${index}`),
    name,
    address: item.display_name || name,
    latitude,
    longitude,
  };
}

export async function searchPlacesByText({ query, latitude, longitude }) {
  const searchText = String(query || "").trim();
  if (searchText.length < 2) {
    return { places: [] };
  }

  const payload = await nominatimRequest("/search", {
    format: "jsonv2",
    q: searchText,
    limit: 8,
    addressdetails: 1,
    lat: latitude,
    lon: longitude,
  });

  const places = Array.isArray(payload) ? payload.map((item, index) => mapPlace(item, index)) : [];
  return { places };
}

export async function reverseGeocodeCoordinates({ latitude, longitude }) {
  const lat = toNumber(latitude, null);
  const lon = toNumber(longitude, null);

  if (lat === null || lon === null) {
    throw new Error("latitude and longitude are required");
  }

  try {
    const payload = await nominatimRequest("/reverse", {
      format: "jsonv2",
      lat,
      lon,
      addressdetails: 1,
    });

    return {
      place: mapPlace(payload),
    };
  } catch {
    return {
      place: {
        id: `${lat}:${lon}`,
        name: "Pinned location",
        address: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        latitude: lat,
        longitude: lon,
      },
    };
  }
}
