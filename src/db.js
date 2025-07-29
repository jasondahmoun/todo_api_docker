import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'todos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = {
  query: (sql, params) => pool.query(sql, params)
};

export default db;
