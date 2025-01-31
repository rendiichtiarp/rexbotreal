const mysql = require('mysql2/promise');
const config = require('../config');

// Konfigurasi pool koneksi
const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000, // timeout 10 detik
    // Tambahan konfigurasi untuk menangani reconnect
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
});

// Fungsi untuk mencoba koneksi ulang
const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error('Error getting connection:', error);
        // Tunggu 5 detik sebelum mencoba koneksi ulang
        await new Promise(resolve => setTimeout(resolve, 5000));
        return getConnection();
    }
};

module.exports = {
    connection: pool,
    getConnection
};