const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

const COOLDOWN = 1 * 60 * 60 * 1000;       // 1 jam
const STREAK_TIMEOUT = 12 * 60 * 60 * 1000; // 12 jam
const MIN_REWARD = 25;
const MAX_REWARD = 50;

// Emoji untuk setiap kategori pekerjaan
const jobCategories = {
  education: "📚",
  maintenance: "🔧",
  labor: "💪",
  farming: "🌾",
  cooking: "👨‍🍳",
  factory: "🏭",
  office: "💼",
  service: "💁‍♂️"
};

// daftar pekerjaan untuk work.js dengan kategori
const possibleJobs = [
  { msg: "Kamu membantu mengajar di sekolah dasar", category: "education" },
  { msg: "Kamu membersihkan sampah di kastil", category: "maintenance" },
  { msg: "Kamu mengangkut barang ke pasar", category: "labor" },
  { msg: "Kamu memanen sayuran di ladang", category: "farming" },
  { msg: "Kamu memperbaiki jalan desa", category: "maintenance" },
  { msg: "Kamu merawat hewan di peternakan", category: "farming" },
  { msg: "Kamu memasak makanan di warung", category: "cooking" },
  { msg: "Kamu merakit mainan di pabrik", category: "factory" },
  { msg: "Kamu mendistribusi surat ke warga", category: "service" },
  { msg: "Kamu menjaga keamanan di gerbang kota", category: "service" },
  { msg: "Kamu menata buku di perpustakaan", category: "education" },
  { msg: "Kamu mengecat pagar rumah warga", category: "maintenance" },
  { msg: "Kamu menulis laporan bulanan kantor", category: "office" },
  { msg: "Kamu menyapu daun di taman", category: "maintenance" },
  { msg: "Kamu membetulkan atap rumah", category: "maintenance" },
  { msg: "Kamu mengoperasikan mesin di pabrik", category: "factory" },
  { msg: "Kamu merajut kain di workshop", category: "factory" },
  { msg: "Kamu menyusui anak ayam di peternakan", category: "farming" },
  { msg: "Kamu menjahit pakaian di konveksi", category: "factory" },
  { msg: "Kamu menyiapkan dokumen di kantor pemerintahan", category: "office" }
];

module.exports = {
  name: "kerja",
  aliases: ["work"],
  category: "game",
  code: async (ctx) => {
    const userId = tools.general.getID(ctx.sender.jid);
    const now = Date.now();

    // Ambil data user
    const userDb = await Database.getUser(userId);
    const last = userDb?.lastWorkTime || 0;
    let streak = userDb?.workStreak || 0;

    // cek cooldown
    if (now - last < COOLDOWN) {
      const remMs = COOLDOWN - (now - last);
      const minutes = Math.floor(remMs / (60 * 1000));
      const seconds = Math.ceil((remMs % (60 * 1000)) / 1000);
      
      return ctx.reply(
        `${quote(`💼 Status Kerja:`)}\n` +
        `${quote(`⏳ Cooldown masih aktif!`)}\n` +
        `${quote(`⏱️ Waktu tersisa: ${monospace(minutes + "m " + seconds + "s")}`)}\n` +
        `${quote(`🔄 Kembali bekerja dalam: ${monospace(Math.ceil(remMs/1000) + "s")}`)}\n` +
        "\n" +
        config.msg.footer
      );
    }

    // pilih pekerjaan random
    const job = possibleJobs[Math.floor(Math.random() * possibleJobs.length)];
    const jobEmoji = jobCategories[job.category];

    let streakMsg = "";
    // cek apakah streak berlanjut atau terputus
    if (last && now - last > STREAK_TIMEOUT) {
      streak = 0;
      streakMsg = `${quote(`⚠️ Streak hilang! Terlalu lama tidak bekerja.`)}\n` +
                  `${quote(`ℹ️ Bekerja dalam 12 jam untuk mempertahankan streak!`)}\n`;
    }

    // naikkan streak
    streak++;

    // hitung reward
    const base = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
    const bonus = streak;
    const reward = base + bonus;

    // Update database dalam satu transaksi
    await Database.updateUser(userId, {
      lastWorkTime: now,
      workStreak: streak,
      coin: (userDb?.coin || 0) + reward
    });

    // kirim reply dengan deskripsi pekerjaan
    return ctx.reply(
      `${quote(`💼 Hasil Kerja:`)}\n` +
      `${quote(`${jobEmoji} ${job.msg}`)}\n` +
      `\n` +
      streakMsg +
      `${quote(`💰 Gaji Pokok: +${monospace(base + " koin")}`)}\n` +
      `${quote(`🔥 Streak Saat Ini: ${monospace(streak + "x")}`)}\n` +
      `${quote(`✨ Bonus Streak: +${monospace(bonus + " koin")}`)}\n` +
      `${quote(`💵 Total Diterima: +${monospace(reward + " koin")}`)}\n` +
      "\n" +
      config.msg.footer
    );
  },
};