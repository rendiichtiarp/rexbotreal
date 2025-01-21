// Modul dan dependensi yang diperlukan
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
        name: "Rexbot", // Nama bot
        prefix: /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i, // Karakter awalan perintah yang diizinkan
        phoneNumber: "", // Nomor telepon bot (opsional jika menggunakan QR code)
        thumbnail: "https://i.imgur.com/lmA0tF5.png", // Gambar thumbnail bot
        website: "https://whatsapp.com/channel/0029Vb1aqIYCMY0EmiUODK00", // Website untuk WhatsApp bot
        groupJid: "120363038568602719@g.us", // JID untuk group bot (opsional jika tidak menggunakan requireBotGroupMembership)
        logGroupJid: "120363366663863260@g.us" // Grup untuk log sistem
    },

    // Pesan bot yang disesuaikan untuk situasi tertentu
    msg: {
        admin: quote("🚫 Hanya admin grup yang dapat mengakses perintah ini!"), // Pesan ketika perintah hanya untuk admin
        banned: quote("🚫 Tidak dapat melanjutkan perintah, karena kamu dibanned oleh Owner!"), // Pesan untuk pengguna yang dibanned
        botAdmin: quote("🚫 Tidak dapat melanjutkan perintah, karena bot bukan Admin grup ini!"), // Pesan jika bot bukan admin di grup
        limit: quote("🚫 Limit penggunaan kamu sudah habis! Gunakan digrup untuk penggunaan tidak terbatas.\n\n> Beli premium untuk penggunaan tidak terbatas di private"),
        botGroupMembership: quote("🚫 Tidak dapat melanjutkan perintah, karena Kamu tidak mengikuti saluran dan grup bot!\n> Klik tautan diatas untuk masuk ke grup bot."), // Pesan untuk pengguna yang tidak ada dalam grup
        // cooldown: quote("🔃 Perintah sedang cooldown 20 detik, sabar..."), // Pesan saat cooldown perintah
        coin: quote("🚫 Koin Kamu tidak cukup! Tidak dapat melanjutkan proses."), // Pesan ketika koin tidak cukup
        groupMode: quote("🚫 Bot dalam mode grup, tidak dapat memproses perintah!"), //Pesan ketika dalam mode grup
        group: quote("🚫 Perintah ini hanya dapat diakses dalam grup!"), // Pesan untuk perintah grup
        onlyGroup: quote("🚫 Perintah ini hanya dapat diakses dalam grup!\n> Beli premium untuk menggunakan dalam private.\n> Hubungi admin/owner untuk membeli premium."), //Pesan jika dalam mode group
        owner: quote("🚫 Perintah ini hanya dapat diakses Owner!"), // Pesan untuk perintah yang hanya owner bisa akses
        premium: quote("🚫 Kamu bukan pengguna premium! Tidak dapat melanjutkan proses."), // Pesan jika pengguna bukan Premium
        private: quote("🚫 Perintah ini hanya dapat diakses dalam obrolan pribadi"), // Pesan untuk perintah obrolan pribadi
        restrict: quote("🚫 Perintah ini dibatasi karena alasan keamanan."), // Pesan pembatasan perintah

        watermark: `@${pkg.name} / v${pkg.version}`, // Watermark nama dan versi pada bot
        footer: monospace("Yuk donasi agar bot ini tetap online! Ketik .donasi untuk donasi dan mendapatkan premium."), // Footer di pesan bot
        readmore: "\u200E".repeat(4001), // String read more
        note: "“Lorem ipsum dolor sit amet, tenebris in umbra, vitae ad mortem.”", // Catatan

        wait: quote("🔃 Tunggu sebentar..."), // Pesan loading
        notFound: quote("❎ Gagal memproses pesan! Coba lagi nanti."), // Pesan item tidak ditemukan
        urlInvalid: quote("❎ URL tidak valid!") // Pesan jika URL tidak valid
    },

    // Informasi owner bot
    owner: {
        name: "Rendi Ichtiar Prasetyo", // Nama owner bot
        organization: "Rendiichtiarrr", // Nama organisasi owner bot
        id: "6281284900651", // Nomor telepon owner bot
        co: ["6281585030507"] // Nomor co-owner bot
    },

    // Kunci API
    APIKey: {
        fasturl: "7849084a-64fc-4265-9450-b4eb2c25b6a8", // APIKey tidak disediakan, Anda dapat menggunakan APIKey Anda sendiri
        gifted: "gifted", // APIKey disediakan oleh Gifted Tech
        nexoracle: "free_key@maher_apis", // APIKey disediakan oleh Maher Zubair
        ssateam: "root" // APIKey disediakan oleh Fainshe
    },
    // Konfigurasi stiker bot
    sticker: {
        packname: "Rexbot", // Nama paket stiker
        author: "IG: @rendiichtiar" // Pembuat stiker
    },

    system: {
        alwaysOnline: false, // Bot selalu aktif
        autoMention: false, // Bot otomatis mention seseorang dalam pesan yang dikirim
        autoRead: false, // Bot baca pesan otomatis
        autoTypingOnCmd: true, // Tampilkan status mengetik saat memproses
        cooldown: 20 * 1000, // Jeda antar perintah (ms)
        port: 3000, // Port (jika pakai server)
        restrict: false, // Batasi akses perintah
        requireBotGroupMembership: false, // Harus gabung grup bot
        selfOwner: true, // Bot jadi owner sendiri
        selfReply: true, // Bot balas pesan bot sendiri
        timeZone: "Asia/Jakarta", // Zona waktu bot
        useCoin: true, // Pakai koin
        useLimit: true, // Pakai limit
        usePairingCode: false, // Pakai kode pairing untuk koneksi
        useServer: false // Jalankan bot tanpa server
    }
};
