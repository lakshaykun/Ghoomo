const TILE_SIZE = 256;

export function latLonToWorld({ latitude, longitude }, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((latitude * Math.PI) / 180);
  const x = ((longitude + 180) / 360) * scale;
  const y =
    (0.5 -
      Math.log((1 + Math.min(Math.max(sinLat, -0.9999), 0.9999)) / (1 - Math.min(Math.max(sinLat, -0.9999), 0.9999))) /
        (4 * Math.PI)) *
    scale;
  return { x, y };
}

export function getMapRegion(points = []) {
  if (!points.length) {
    return { latitude: 30.9712921, longitude: 76.4731677, zoom: 13 };
  }

  const lats = points.map((point) => point.latitude);
  const lons = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLon + maxLon) / 2;
  const latDelta = Math.max(0.01, maxLat - minLat);
  const lonDelta = Math.max(0.01, maxLon - minLon);
  const span = Math.max(latDelta, lonDelta);

  let zoom = 13;
  if (span > 0.5) zoom = 9;
  else if (span > 0.2) zoom = 10;
  else if (span > 0.08) zoom = 11;
  else if (span > 0.03) zoom = 12;
  else if (span > 0.015) zoom = 13;
  else zoom = 14;

  return { latitude, longitude, zoom };
}

export function buildTileGrid(region, rows = 3, cols = 3) {
  const centerWorld = latLonToWorld(region, region.zoom);
  const centerTileX = Math.floor(centerWorld.x / TILE_SIZE);
  const centerTileY = Math.floor(centerWorld.y / TILE_SIZE);
  const originX = centerWorld.x - (cols * TILE_SIZE) / 2;
  const originY = centerWorld.y - (rows * TILE_SIZE) / 2;
  const tiles = [];

  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      const x = centerTileX + col;
      const y = centerTileY + row;
      tiles.push({
        key: `${region.zoom}-${x}-${y}`,
        x,
        y,
        left: x * TILE_SIZE - originX,
        top: y * TILE_SIZE - originY,
        url: `https://basemaps.cartocdn.com/rastertiles/voyager/${region.zoom}/${x}/${y}.png`,
      });
    }
  }

  return {
    width: cols * TILE_SIZE,
    height: rows * TILE_SIZE,
    originX,
    originY,
    tiles,
  };
}

export function projectToGrid(point, region, grid) {
  const world = latLonToWorld(point, region.zoom);
  return {
    x: world.x - grid.originX,
    y: world.y - grid.originY,
  };
}

export async function fetchOSRMRoute(pickup, drop, returnDetails = false) {
  const fallback = returnDetails ? { points: [], distance: 0, duration: 0 } : [];
  if (!pickup || !drop) return fallback;

  try {
    const pLon = Number(pickup.longitude || pickup.lng || 0);
    const pLat = Number(pickup.latitude || pickup.lat || 0);
    const dLon = Number(drop.longitude || drop.lng || 0);
    const dLat = Number(drop.latitude || drop.lat || 0);

    // Basic coordinate validation
    if (!pLon || !pLat || !dLon || !dLat) return fallback;

    // If locations are practically identical (less than ~10 meters), return empty/direct
    const distSq = Math.pow(pLon - dLon, 2) + Math.pow(pLat - dLat, 2);
    if (distSq < 0.0000001) {
      return returnDetails ? { points: [{ latitude: pLat, longitude: pLon }], distance: 0, duration: 0 } : [{ latitude: pLat, longitude: pLon }];
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      timeout: 5000 
    });

    if (!response.ok) {
      console.warn(`[Map] OSRM status error: ${response.status}`);
      return fallback;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`[Map] OSRM non-JSON response received: ${text.substring(0, 50)}...`);
      return fallback;
    }

    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const points = route.geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
      if (returnDetails) {
        return {
          points,
          distance: route.distance, // in meters
          duration: route.duration  // in seconds
        };
      }
      return points;
    } else {
      console.warn(`[Map] OSRM error code: ${data.code || 'Unknown'}`);
    }
  } catch (err) {
    console.warn("[Map] fetchOSRMRoute catch:", err.message || err);
  }
  return fallback;
}
