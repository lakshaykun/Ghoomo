const { query } = require("/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/backend/src/config/db");

async function forceOnline() {
  const userId = "800ca679-f823-4948-a8e6-e44f96fbb281";
  const res = await query(`
    UPDATE drivers
    SET availability_status = 'idle', is_available = true
    WHERE user_id = $1
    RETURNING *
  `, [userId]);
  console.log("Updated Row:", res.rows[0]);
}

forceOnline().catch(console.error);
