/**
 * Seed Script - Insert initial test data
 * Run after migrations: node seed.js
 */

const pool = require('../../backend/config/database');

async function seedDatabase() {
  try {
    console.log('Seeding database with test data...');

    // Insert test users
    await pool.query(`
      INSERT INTO users (name, email, phone, role) VALUES
      ('John Doe', 'john@iitropar.ac.in', '+919876543210', 'student'),
      ('Raj Kumar', 'raj@iitropar.ac.in', '+919876543211', 'driver'),
      ('Admin User', 'admin@ghoomo.com', '+919876543212', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✓ Test data inserted successfully');
    await pool.end();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
