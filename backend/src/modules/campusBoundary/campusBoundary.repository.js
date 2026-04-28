const { query, withTransaction } = require("../../config/db");

const CACHE_TTL_MS = 10000;

let boundaryCache = null;
let boundaryCacheAt = 0;

function toBoundaryPoint(row = {}) {
  return {
    id: row.id,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    createdAt: row.created_at || row.createdAt || null,
  };
}

function isBoundaryCacheFresh() {
  return Array.isArray(boundaryCache) && Date.now() - boundaryCacheAt < CACHE_TTL_MS;
}

function setBoundaryCache(points) {
  boundaryCache = Array.isArray(points) ? points : [];
  boundaryCacheAt = Date.now();
}

async function getCampusBoundaryPoints({ forceRefresh = false } = {}) {
  if (!forceRefresh && isBoundaryCacheFresh()) {
    return boundaryCache;
  }

  const result = await query(
    `
    SELECT id, latitude, longitude, sort_order, created_at
    FROM campus_boundary
    ORDER BY sort_order ASC, id ASC
    `
  );

  const points = result.rows.map(toBoundaryPoint);
  setBoundaryCache(points);
  return points;
}

async function replaceCampusBoundaryPoints(points = []) {
  return withTransaction(async (client) => {
    await client.query("DELETE FROM campus_boundary");

    const inserted = [];
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const result = await client.query(
        `
        INSERT INTO campus_boundary (latitude, longitude, sort_order)
        VALUES ($1, $2, $3)
        RETURNING id, latitude, longitude, sort_order, created_at
        `,
        [point.latitude, point.longitude, point.sortOrder ?? index]
      );

      if (result.rows[0]) {
        inserted.push(toBoundaryPoint(result.rows[0]));
      }
    }

    setBoundaryCache(inserted);
    return inserted;
  });
}

module.exports = {
  getCampusBoundaryPoints,
  replaceCampusBoundaryPoints,
  setBoundaryCache,
};