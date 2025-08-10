const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'rent_management',
//   waitForConnections: true,
//   connectionLimit: 20,
//   queueLimit: 0,
//   ssl: {
//     ca: fs.readFileSync('./ca.pem')
//   }
// };
const dbConfig = {
  host: 'localhost',
  user: 'rent_management',
  password: 'rent_management!',
  database: 'rent_management',
  waitForConnections: true,
  connectionLimit: 20,
};
const pool = mysql.createPool(dbConfig);

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

testConnection();

module.exports = pool;