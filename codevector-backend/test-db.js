require('dotenv').config(); 
const { Pool } = require('pg'); 


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('Attempting to connect to the database...');
    
    // Ask the database for its current time
    const result = await pool.query('SELECT NOW();');
    
    console.log(' Success! Connected to PostgreSQL.');
    console.log('Database Time is:', result.rows[0].now);
  } catch (error) {
    console.error(' Connection Failed:', error.message);
  } finally {
    
    await pool.end();
  }
}

testConnection();