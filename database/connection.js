const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

// Fungsi untuk test koneksi database
const testConnection = async () => {
    try {
        const conn = await connection.getConnection();
        conn.release();
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = {
    connection,
    testConnection
};