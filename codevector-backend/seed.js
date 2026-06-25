require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Beauty', 'Sports'];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('1. Creating the products table and indexes...');
    
    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clear any existing data if you run this script more than once
    await client.query('TRUNCATE TABLE products RESTART IDENTITY;');

    // Create an index to make cursor pagination lightning fast
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_created_id 
      ON products (category, created_at DESC, id DESC);
    `);
    
    console.log('✅ Table and indexes ready!');
    console.log('2. Starting fast batch insertion of 200,000 products...');

    const totalRecords = 200000;
    const batchSize = 5000; // Insert 5000 rows at a time
    let baseTime = Date.now(); // We will subtract time from this so items look older

    await client.query('BEGIN'); // Start a transaction for speed and safety

    for (let i = 0; i < totalRecords; i += batchSize) {
      const values = [];
      const valueStrings = [];
      
      for (let j = 0; j < batchSize; j++) {
        const currentIdx = i + j + 1;
        const name = `Product ${currentIdx}`;
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const price = parseFloat((Math.random() * 500 + 5).toFixed(2));
        
        // Stagger the timestamps so we have a realistic "newest first" timeline
        const createdAt = new Date(baseTime - (currentIdx * 1000)).toISOString();

        // Postgres parameter tracking ($1, $2, etc.)
        const offset = j * 5;
        valueStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        values.push(name, category, price, createdAt, createdAt);
      }

      // Build the giant INSERT query for this batch
      const query = `
        INSERT INTO products (name, category, price, created_at, updated_at)
        VALUES ${valueStrings.join(', ')}
      `;
      
      await client.query(query, values);
      
      // Print progress so we know it hasn't frozen
      console.log(`...Inserted ${i + batchSize} / ${totalRecords} products`);
    }

    await client.query('COMMIT'); // Save all the changes
    console.log('🎉 Seeding completed successfully in record time!');

  } catch (error) {
    await client.query('ROLLBACK'); // If something fails, undo everything
    console.error('❌ Error during seeding:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();