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
    timeout: 60000,
    ssl: {
        rejectUnauthorized: false
    },
    maxIdle: 60000,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

// Fungsi untuk mencoba koneksi ulang
async function reconnect() {
    try {
        const connection = await pool.getConnection();
        c.success('Berhasil terhubung kembali ke MySQL');
        connection.release();
    } catch (err) {
        c.error('Gagal melakukan reconnect ke MySQL:', err.message);
        setTimeout(reconnect, 5000);
    }
}

// Event handler untuk disconnect
pool.on('error', (err) => {
    c.error('MySQL pool error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        c.info('Mencoba melakukan reconnect ke MySQL...');
        reconnect();
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
        c.info('Mencoba melakukan reconnect...');
        reconnect();
    });

module.exports = { pool };
