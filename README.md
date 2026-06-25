# CodeVector Internship - Fullstack E-Commerce Task

A full-stack web application built to demonstrate high-performance backend engineering, handling a dataset of 200,000 products with zero-shifting real-time cursor pagination.

## 🚀 Live Demo
* **Frontend:** https://codevector-frontend-vqk1.onrender.com
* **Backend API:** https://codevector-backend-ecmj.onrender.com

## 🛠 Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Hosted on Neon serverless)
* **Frontend:** React, Vite, Tailwind CSS (v4)
* **Deployment:** Render / Vercel

---

## 🧠 Core Technical Decisions

### 1. Cursor-Based Pagination (Keyset Pagination)
Traditional `OFFSET`-based pagination suffers from severe performance degradation at scale ($O(N)$) and causes UI bugs (duplicate or missing items) if new rows are inserted at the top of the dataset while a user is browsing. 

To solve this, I implemented **Cursor-Based Pagination**. The backend generates a Base64 encoded token combining the `created_at` timestamp and `id`. This allows the database to fetch the next page in $O(\log N)$ time, and the user's viewport remains perfectly consistent regardless of real-time database insertions.

### 2. High-Performance Indexing
To ensure the cursor pagination operates at peak efficiency, a composite index was applied to the database:
`CREATE INDEX idx_products_category_created_id ON products (category, created_at DESC, id DESC);`
This allows the Postgres query planner to locate and return the exact slice of required data instantly without scanning the entire table.

### 3. Optimized Database Seeding
Instead of using a standard iterative loop that executes 200,000 individual SQL inserts (which is slow and connection-heavy), the `seed.js` script groups data into parameterized multi-row transaction batches of 5,000 items. This seeds the entire 200k row database in a matter of seconds.

---

## 📁 Project Structure

This repository is structured as a monorepo containing both the backend service and the frontend user interface.

```text
/
├── codevector-backend/      # Express API & Postgres logic
│   ├── server.js            # Main API entry point
│   └── seed.js              # 200k row fast-seed script
│
└── codevector-frontend/     # React + Vite UI
    ├── src/
    │   ├── App.jsx          # Main UI component & data fetching
    │   └── index.css        # Tailwind V4 configuration
    └── package.json
