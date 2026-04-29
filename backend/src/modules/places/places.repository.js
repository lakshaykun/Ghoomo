const { query } = require("../../config/db");

function normalizePlaceName(name) {
  return String(name || "").trim().toLowerCase();
}

async function searchGlobalPlacesByPrefix(searchText, limit = 8) {
  const normalized = normalizePlaceName(searchText);
  if (!normalized) return [];

  const result = await query(
    `
    SELECT id, name, address, latitude, longitude
    FROM global_places
    WHERE normalized_name LIKE $1
    ORDER BY
      CASE WHEN normalized_name = $2 THEN 0 ELSE 1 END,
      length(normalized_name) ASC,
      updated_at DESC
    LIMIT $3
    `,
    [`${normalized}%`, normalized, limit]
  );

  return result.rows;
}

async function upsertGlobalPlace({ name, address, latitude, longitude }) {
  const normalizedName = normalizePlaceName(name);
  const result = await query(
    `
    INSERT INTO global_places (name, normalized_name, address, latitude, longitude)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (normalized_name, latitude, longitude)
    DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      updated_at = NOW()
    RETURNING id, name, address, latitude, longitude
    `,
    [name, normalizedName, address, latitude, longitude]
  );
  return result.rows[0] || null;
}

module.exports = {
  normalizePlaceName,
  searchGlobalPlacesByPrefix,
  upsertGlobalPlace,
};
