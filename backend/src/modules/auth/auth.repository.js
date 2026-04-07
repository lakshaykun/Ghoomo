const { query } = require("../../config/db");

async function findByEmail(email) {
  const result = await query(
    `
    SELECT id, name, email, phone, password_hash, role, created_at, updated_at
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
    SELECT id, name, email, phone, password_hash, role, created_at, updated_at
    FROM users
    WHERE phone = $1
    LIMIT 1
    `,
    [phone]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `
    SELECT id, name, email, phone, password_hash, role, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function createUser({ name, email, phone, passwordHash, role }) {
  const result = await query(
    `
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, phone, password_hash, role, created_at, updated_at
    `,
    [name, email, phone, passwordHash, role]
  );

  return result.rows[0];
}

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  createUser,
};
