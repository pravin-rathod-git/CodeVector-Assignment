require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());


const cors = require('cors');
app.use(cors());


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const encodeCursor = (createdAt, id) => {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64');
};

const decodeCursor = (cursorStr) => {
  try {
    return JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
};

app.get('/api/products', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { category, cursor } = req.query;
    
    let queryText = 'SELECT id, name, category, price, created_at FROM products';
    const queryParams = [];
    const conditions = [];

    if (category) {
      queryParams.push(category);
      conditions.push(`category = $${queryParams.length}`);
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded && decoded.createdAt && decoded.id) {
        queryParams.push(decoded.createdAt, decoded.id);
        const timeParam = `$${queryParams.length - 1}`;
        const idParam = `$${queryParams.length}`;
        
        conditions.push(`(created_at < ${timeParam} OR (created_at = ${timeParam} AND id < ${idParam}))`);
      } else {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryParams.push(limit + 1);
    queryText += ` ORDER BY created_at DESC, id DESC LIMIT $${queryParams.length}`;

    const { rows } = await pool.query(queryText, queryParams);

    const hasNextPage = rows.length > limit;
    const results = hasNextPage ? rows.slice(0, limit) : rows;

    let nextCursor = null;
    if (hasNextPage && results.length > 0) {
      const lastItem = results[results.length - 1];
      nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
    }

    res.json({
      data: results,
      pagination: {
        limit,
        nextCursor,
        hasNextPage
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});