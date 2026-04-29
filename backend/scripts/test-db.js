const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false;

console.log("Attempting to connect to:", connectionString.replace(/:[^@:]*@/, ":****@"));
console.log("SSL Config:", ssl);

const pool = new Pool({
  connectionString,
  ssl,
  connectionTimeoutMillis: 5000,
});

async function test() {
  try {
    const start = Date.now();
    const res = await pool.query("SELECT NOW()");
    console.log("Connection successful!");
    console.log("Time from DB:", res.rows[0].now);
    console.log("Duration:", Date.now() - start, "ms");
  } catch (err) {
    console.error("Connection failed!");
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
