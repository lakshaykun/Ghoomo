const { query } = require("/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/backend/src/config/db");

async function checkCandidates() {
  const userId = "800ca679-f823-4948-a8e6-e44f96fbb281";
  const res = await query(`
    SELECT rrc.*, rr.status as request_status
    FROM ride_request_candidates rrc
    INNER JOIN drivers d ON d.id = rrc.driver_id
    INNER JOIN ride_requests rr ON rr.id = rrc.request_id
    WHERE d.user_id = $1
    ORDER BY rrc.offered_at DESC
    LIMIT 5
  `, [userId]);
  console.log("Candidates:", res.rows);
}

checkCandidates().catch(console.error);
