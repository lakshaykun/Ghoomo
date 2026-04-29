const { query } = require("/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/backend/src/config/db");

async function checkDriver() {
  const userId = "800ca679-f823-4948-a8e6-e44f96fbb281"; // From user's logs
  const res = await query("SELECT * FROM drivers WHERE user_id = $1", [userId]);
  process.stdout.write(JSON.stringify(res.rows[0]) + "\n");
  process.exit(0);
}

checkDriver().catch((err) => {
  console.error(err);
  process.exit(1);
});
