const { query } = require("../../config/db");

// ── Read ─────────────────────────────────────────────────────────────────────

async function getAllPopularPlaces() {
  const result = await query(
    `SELECT id, name, address, latitude, longitude, sort_order, created_at, updated_at
     FROM popular_places
     ORDER BY sort_order ASC, name ASC`
  );
  return result.rows;
}

// ── Create ────────────────────────────────────────────────────────────────────

async function createPopularPlace({ name, address, latitude, longitude, sort_order = 0 }) {
  const result = await query(
    `INSERT INTO popular_places (name, address, latitude, longitude, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, address, latitude, longitude, sort_order, created_at, updated_at`,
    [name.trim(), address.trim(), latitude, longitude, sort_order]
  );
  return result.rows[0];
}

// ── Update ────────────────────────────────────────────────────────────────────

async function updatePopularPlace(id, { name, address, latitude, longitude, sort_order }) {
  const result = await query(
    `UPDATE popular_places
     SET
       name       = COALESCE($2, name),
       address    = COALESCE($3, address),
       latitude   = COALESCE($4, latitude),
       longitude  = COALESCE($5, longitude),
       sort_order = COALESCE($6, sort_order),
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, address, latitude, longitude, sort_order, created_at, updated_at`,
    [id, name?.trim() ?? null, address?.trim() ?? null, latitude ?? null, longitude ?? null, sort_order ?? null]
  );
  return result.rows[0] || null;
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deletePopularPlace(id) {
  const result = await query(
    `DELETE FROM popular_places WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
}

// ── Duplicate checks ──────────────────────────────────────────────────────────

async function findByName(name, excludeId = null) {
  const result = await query(
    `SELECT id FROM popular_places
     WHERE lower(trim(name)) = lower(trim($1))
       AND ($2::int IS NULL OR id != $2)
     LIMIT 1`,
    [name, excludeId || null]
  );
  return result.rows[0] || null;
}

async function findByCoords(latitude, longitude, excludeId = null) {
  // Treat places within ~5 metres as duplicates
  const result = await query(
    `SELECT id FROM popular_places
     WHERE abs(latitude  - $1) < 0.00005
       AND abs(longitude - $2) < 0.00005
       AND ($3::int IS NULL OR id != $3)
     LIMIT 1`,
    [latitude, longitude, excludeId || null]
  );
  return result.rows[0] || null;
}

module.exports = {
  getAllPopularPlaces,
  createPopularPlace,
  updatePopularPlace,
  deletePopularPlace,
  findByName,
  findByCoords,
};
