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
    SELECT id, user_id, name, address, latitude, longitude, created_at
    FROM saved_locations
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

async function createSavedLocation({ userId, name, address, latitude, longitude }) {
  const result = await query(
    `
    INSERT INTO saved_locations (user_id, name, address, latitude, longitude)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, name, address, latitude, longitude, created_at
    `,
    [userId, name, address, latitude, longitude]
  );

  return result.rows[0];
}

async function deleteSavedLocation(userId, locationId) {
  const result = await query(
    `
    DELETE FROM saved_locations
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
