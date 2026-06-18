const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Prevents MySQL from automatically shifting dates into UTC objects
});

// Test query connection immediately on application boot up
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MariaDB/MySQL database successfully.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection setup failed:', err.message);
  });

module.exports = pool;