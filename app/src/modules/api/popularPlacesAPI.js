import { httpClient } from "./core/httpClient";

const CACHE_KEY   = "__ghoomo_popular_places__";
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutes

let memoryCache = null; // { places, fetchedAt }

async function fetchFromNetwork() {
  const data = await httpClient.get("/api/places/popular", {
    auth: false,
  });
  return Array.isArray(data) ? data : [];
}


function readDiskCache() {
  try {
    const raw = typeof localStorage !== "undefined"
      ? localStorage.getItem(CACHE_KEY)
      : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDiskCache(places) {
  try {
    const payload = { places, fetchedAt: Date.now() };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    }
    memoryCache = payload;
  } catch {
    // Storage might be unavailable (RN without AsyncStorage polyfill)
  }
}

/**
 * Returns popular places from the fastest available source:
 *   1. In-memory cache (same session, <5 min)
 *   2. Disk cache (localStorage / AsyncStorage polyfill)
 *   3. Network fetch
 *
 * @param {boolean} forceRefresh — skip all caches and always hit the network
 */
export async function getPopularPlaces(forceRefresh = false) {
  if (!forceRefresh) {
    if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL) {
      return memoryCache.places;
    }
    const disk = readDiskCache();
    if (disk) {
      memoryCache = disk;
      return disk.places;
    }
  }

  const places = await fetchFromNetwork();
  writeDiskCache(places);
  return places;
}

/** Prefetch on app start — call once in the root component. */
export function prefetchPopularPlaces() {
  getPopularPlaces().catch(() => {}); // fire-and-forget
}
