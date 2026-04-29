const { query } = require("/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/backend/src/config/db");

async function checkTriggers() {
  const res = await query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'drivers'
  `);
  process.stdout.write(JSON.stringify(res.rows, null, 2) + "\n");
  process.exit(0);
}

checkTriggers().catch(console.error);
