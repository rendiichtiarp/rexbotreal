// Impor modul dan dependensi yang diperlukan
const pkg = require("./package.json");
const {
    monospace,
    italic,
    quote
} = require("@mengkodingan/ckptw");

// Konfigurasi
global.config = {
    // Informasi bot dasar
    bot: {
        name: "RexbotX", // Nama bot
        prefix: /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i, // Karakter awalan perintah yang diizinkan
        phoneNumber: "6285891742650", // Nomor telepon bot (opsional jika menggunakan QR code)
        thumbnail: "https://raw.githubusercontent.com/rendiichtiarp/RexbotX/refs/heads/main/thumbnail-rexbotx-ramadhan.png", // Gambar thumbnail bot
        website: "https://whatsapp.com/channel/0029Vb1aqIYCMY0EmiUODK00", // Website untuk WhatsApp bot
        groupJid: "", // JID untuk group bot (opsional jika tidak menggunakan requireBotGroupMembership)

        // Konfigurasi channel untuk broadcast
        groups: {
            report: "120363366663863260@g.us" // ID group untuk laporan
        },

        // Konfigurasi autentikasi sesi bot
        authAdapter: {
            adapter: "default", // Pilihan adapter: 'default', 'mysql', 'mongo', 'firebase'

            // Konfigurasi default
            default: {
                authDir: "state"
            },

            // Konfigurasi MySQL
            mysql: {
                host: "localhost:3306", // Nama host 
                user: "root", // Nama pengguna
                password: "admin123", // Kata sandi
                database: "ckptw-wabot" // Nama database
            },

            // Konfigurasi MongoDB
            mongodb: {
                url: "mongodb://localhost:27017/ckptw-wabot" // URL
            },

            // Konfigurasi Firebase
            firebase: {
                tableName: "ckptw-wabot", // Nama tabel
                session: "state" // Nama sesi
            }
        }
    },

    // Pesan bot yang disesuaikan untuk situasi tertentu
    msg: {
        admin: quote("⛔ Perintah hanya dapat diakses oleh admin grup!"), // Pesan saat perintah hanya untuk admin
        banned: quote("⛔ Tidak dapat memproses karena Anda telah dibanned oleh Owner!"), // Pesan untuk pengguna yang dibanned
        botAdmin: quote("⛔ Tidak dapat memproses karena bot bukan admin grup ini!"), // Pesan jika bot bukan admin di grup
        botGroupMembership: quote("⛔ Tidak dapat memproses karena Anda tidak bergabung dengan grup bot! Ketik '/botgroup' untuk mendapatkan tautan grup bot."), // Pesan untuk pengguna yang tidak ada dalam grup
        coin: quote("⛔ Tidak dapat memproses karena koin Anda tidak cukup!\n> Claim coin harian menggunakan `.claim` atau bermain game untuk mendapatkan koin `.menu game`."), // Pesan saat koin tidak cukup
        cooldown: quote("🔄 Perintah ini sedang dalam cooldown, tunggu...\n> Selanjutnya akan diberi reaksi '🔄' ketika cooldown dan '✅' ketika selesai."), // Pesan saat cooldown perintah
        group: quote("⛔ Perintah hanya dapat diakses dalam grup!"), // Pesan untuk perintah grup
        owner: quote("⛔ Perintah hanya dapat diakses Owner!"), // Pesan untuk perintah yang hanya owner bisa akses
        premium: quote("⛔ Tidak dapat memproses karena Anda bukan pengguna Premium!"), // Pesan jika pengguna bukan Premium
        private: quote("⛔ Perintah hanya dapat diakses dalam obrolan pribadi!"), // Pesan untuk perintah obrolan pribadi
        restrict: quote("⛔ Perintah ini telah dibatasi karena alasan keamanan!"), // Pesan pembatasan perintah
        register: quote("❎ Anda belum terdaftar! Silakan daftar terlebih dahulu.\n\n> Pendaftaran RexbotX melalui:\n" +
            "https://rexbotx.xyz\n\n" +
            "Cara pendaftaran:\n" +
            "1. Klik tautan diatas\n" +
            "2. Dihalaman website klik garis tiga di kanan atas\n" +
            "3. Pilih menu Daftar\n" +
            "4. Isi data Anda\n" +
            "5. Selamat, Anda sudah terdaftar di RexbotX\n"),

        watermark: `@${pkg.name} / v${pkg.version}`, // Watermark nama dan versi pada bot
        footer: italic("Developed by @rendiichtiar"), // Footer di pesan bot
        readmore: "\u200E".repeat(4001), // String read more
        note: "“Lorem ipsum dolor sit amet, tenebris in umbra, vitae ad mortem.”", // Catatan

        wait: quote("🔄 Tunggu sebentar..."), // Pesan loading
        notFound: quote("❎ Tidak ada yang ditemukan! Coba lagi nanti."), // Pesan item tidak ditemukan
        urlInvalid: quote("❎ URL tidak valid!") // Pesan jika URL tidak valid
    },

    // Informasi owner bot
    owner: {
        name: "", // Nama owner bot
        organization: "", // Nama organisasi owner bot
        id: "", // Nomor telepon owner bot
        co: [""] // Nomor co-owner bot
    },

    // Stiker bot
    sticker: {
        packname: "", // Nama paket stiker
        author: "" // Pembuat stiker
    },

    // Sistem bot
    system: {
        alwaysOnline: true, // Bot selalu berstatus "online"
        antiCall: true, // Bot secara otomatis membanned orang yang menelepon
        autoMention: true, // Bot otomatis mention seseorang dalam pesan yang dikirim
        autoRead: false, // Bot baca pesan otomatis
        autoTypingOnCmd: true, // Tampilkan status "sedang mengetik" saat memproses perintah
        cooldown: 15 * 1000, // Jeda antar perintah (ms)
        port: 3000, // Port (jika pakai server)
        restrict: false, // Batasi akses perintah
        requireBotGroupMembership: false, // Harus gabung grup bot
        selfOwner: false, // Bot jadi owner sendiri
        selfReply: true, // Bot balas pesan bot sendiri
        timeZone: "Asia/Jakarta", // Zona waktu bot
        useCoin: true, // Pakai koin
        usePairingCode: false, // Pakai kode pairing untuk koneksi
        useServer: true // Jalankan bot dengan server
    }
};
