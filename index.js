// Modul dan dependensi yang diperlukan
require("./config.js");
const handler = require("./handler.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const CFonts = require("cfonts");
const http = require("http");
const {
    Consolefy
} = require("@mengkodingan/consolefy");
const { testConnection } = require('./database/connection');

// Buat consolefy
const c = new Consolefy({
    tag: pkg.name
});

// Atur konfigurasi ke global
global.handler = handler;
global.config.pkg = pkg;
global.tools = tools;
global.consolefy = c;
// Memulai
c.log(`Starting...`);
// Tampilkan judul menggunakan CFonts
CFonts.say(pkg.name, {
    font: "chrome",
    align: "center",
    gradient: ["red", "magenta"]
});
// Menampilkan informasi paket
const authorName = pkg.author.name || pkg.author;
CFonts.say(
    `'${pkg.description}'\n` +
    `By ${authorName}`, {
        font: "console",
        align: "center",
        gradient: ["red", "magenta"]
    }
);
// Fungsi untuk menjalankan server jika diaktifkan
if (config.system.useServer) {
    const port = config.system.port;
    const server = http.createServer((req, res) => {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end(`${pkg.name} is running on port ${port}`);
    });
    server.listen(port, () => {
        c.success(`Server is running at http://localhost:${port}`);
    });
}
// Test koneksi database saat aplikasi dimulai
testConnection()
    .then(isConnected => {
        if (isConnected) {
            c.success('Mysql Database Connected');
        } else {
            c.error('Mysql Database Connection Failed');
            process.exit(1);
        }

    })
    .catch(error => {
        console.error('Error Mysql Database Connection:', error);
        process.exit(1);
    });
// Impor dan jalankan modul utama
require("./main.js");