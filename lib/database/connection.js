const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi database
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
};

// Membuat pool koneksi
const pool = mysql.createPool(dbConfig);

// Fungsi untuk menguji koneksi
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        connection.release();
    } catch (error) {
        throw error;
    }
}

// Fungsi untuk mendapatkan koneksi dari pool
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Gagal mendapatkan koneksi:', error);
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    getConnection
};
