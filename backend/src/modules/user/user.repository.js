const { query } = require("../../config/db");

async function findById(userId) {
  const result = await query(
    `
    SELECT id, name, email, phone, role, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findByEmail(email) {
  const result = await query(
    `
    SELECT id, name, email, phone, role, created_at, updated_at
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findByPhone(phone) {
  const result = await query(
    `
    SELECT id, name, email, phone, role, created_at, updated_at
    FROM users
    WHERE phone = $1
    LIMIT 1
    `,
    [phone]
  );

  return result.rows[0] || null;
}

async function updateById(userId, fields) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return findById(userId);
  }

  const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);

  const result = await query(
    `
    UPDATE users
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${values.length + 1}
    RETURNING id, name, email, phone, role, created_at, updated_at
    `,
    [...values, userId]
  );

  return result.rows[0] || null;
}

async function listSavedLocations(userId) {
  const result = await query(
    `
    SELECT
      uf.id,
      uf.user_id,
      COALESCE(uf.label, gp.name) AS name,
      gp.address,
      gp.latitude,
      gp.longitude,
      uf.created_at
    FROM user_favourites uf
    INNER JOIN global_places gp ON gp.id = uf.place_id
    WHERE uf.user_id = $1
    ORDER BY uf.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

async function createSavedLocation({ userId, name, address, latitude, longitude }) {
  const normalizedName = String(name || "").trim().toLowerCase();
  const placeResult = await query(
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

  const place = placeResult.rows[0];
  const result = await query(
    `
    INSERT INTO user_favourites (user_id, place_id, label)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, place_id)
    DO UPDATE SET label = EXCLUDED.label
    RETURNING id, user_id, created_at
    `,
    [userId, place.id, name]
  );

  return {
    ...result.rows[0],
    name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

async function deleteSavedLocation(userId, locationId) {
  const result = await query(
    `
    DELETE FROM user_favourites
    WHERE user_id = $1 AND id = $2
    `,
    [userId, locationId]
  );

  return result.rowCount > 0;
}

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  updateById,
  listSavedLocations,
  createSavedLocation,
  deleteSavedLocation,
};
