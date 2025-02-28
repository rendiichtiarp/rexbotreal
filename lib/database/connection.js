const mysql = require('mysql2/promise');
require('dotenv').config();
const pkg = require("../../package.json");

const {
    Consolefy
} = require("@mengkodingan/consolefy");
// Inisialisasi Consolefy untuk logging
const c = new Consolefy({
    tag: pkg.name
});

// Konfigurasi pool koneksi
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Cek koneksi saat startup
pool.getConnection()
    .then(conn => {
        c.success('Berhasil terhubung ke MySQL');
        conn.release();
    })
    .catch(err => {
        c.error('Gagal terhubung ke MySQL:', err.message);
        process.exit(1); // Hentikan aplikasi jika gagal connect
    });

module.exports = { pool };
