const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
  name: "cari",
  aliases: ["search", "nyari"],
  category: "game",
  code: async (ctx) => {
    const userJid = ctx.sender.jid;
    const userId = tools.general.getID(userJid);
    const now = Date.now();
    const COOLDOWN = 60 * 1000; // 1 menit

    // Ambil data user
    const userDb = await Database.getUser(userId);
    const last = userDb?.lastScavenge || 0;

    // Cooldown check
    if (now - last < COOLDOWN) {
      const rem = Math.ceil((COOLDOWN - (now - last)) / 1000);
      return ctx.reply(
        `${quote(`⏳ Cooldown masih aktif!`)}\n` +
        `${quote(`🕔 Tunggu ${monospace(rem + "s")} lagi sebelum mencari.`)}\n` +
        "\n" +
        config.msg.footer
      );
    }

    // Random amount between -10 and +15
    const amount = Math.floor(Math.random() * 26) - 5;
    
    // Messages for positive/negative finds
    const pos = [
      "Kamu menemukan beberapa koin di vending machine rusak! 🎰",
      "Ada koin terselip di mesin cuci koin publik! 🧺",
      "Dompet tua di parkiran ternyata berisi beberapa koin! 👛",
      "Sekumpulan receh terjatuh di tangga, kamu kumpulkan! 🪙",
      "Kucing lucu menuntunmu ke kantong koin tersembunyi! 🐱",
      "Orang lupa di warung kopi meninggalkan kembalian! ☕",
      "Kotak amal kosong tiba-tiba memuntahkan koin! 📦",
      "Temanmu iseng membagikan recehan, dapat sedikit koin! 🤝",
      "Seorang turis asing memberi tip dalam bentuk koin! 🌏",
      "Kamu nemu kantong kecil penuh koin di semak-semak! 🌿",
      "Recehan jatuh dari langit… entah dari mana asalnya! ⭐",
      "Kamu dapatkan kupon diskon untuk beli koin lebih murah! 🎫",
      "Satu koinmu membeli kupon peruntungan, ternyata kena koin! 🎲"
    ];
    const neg = [
      "Kamu kecopet di pasar, koinmu raib! 😭",
      "Terpeleset dan koin di sakumu muncrat semua! 💨",
      "Uangmu jatuh dimakan mesin parkir otomatis! 🚗",
      "Selembar tiket bus berubah jadi utang koin! 🚌",
      "Dompet sobek, koin tumpah ke got! 💦",
      "Orang iseng menipu, kamu kehilangan koin! 😤",
      "Kamu tertipu oleh penukar recehan palsu! 🎭",
      "Serangga menggigit, panik, koin terlempar! 🐜",
      "Hujan tiba-tiba, koinmu hilang di selokan! 🌧️",
      "Kamu mencoba mengais, tapi malah membayar parkir! 🅿️",
      "Kamu mencari, tapi ternyata dompetmu di rumah! 🏠",
      "Sarapanmu terlalu enak, malah lupa koin di meja! 🍳"
    ];

    // Update lastScavenge dan coin dalam satu transaksi
    const currentCoin = userDb?.coin || 0;
    await Database.updateUser(userId, {
      lastScavenge: now,
      coin: currentCoin + amount
    });

    // pick message and return response
    if (amount > 0) {
      const msg = pos[Math.floor(Math.random() * pos.length)];
      return ctx.reply(
        `${quote("🔍 Hasil Pencarian:")}\n` +
        `${quote(msg)}\n` +
        `${quote(`💰 Kamu mendapatkan ${monospace(amount + " koin")}!`)}\n` +
        "\n" +
        config.msg.footer
      );
    } else if (amount < 0) {
      const msg = neg[Math.floor(Math.random() * neg.length)];
      return ctx.reply(
        `${quote("🔍 Hasil Pencarian:")}\n` +
        `${quote(msg)}\n` +
        `${quote(`💸 Kamu kehilangan ${monospace(Math.abs(amount) + " koin")}!`)}\n` +
        "\n" +
        config.msg.footer
      );
    } else {
      // amount == 0
      return ctx.reply(
        `${quote("🔍 Hasil Pencarian:")}\n` +
        `${quote("Kamu mencari ke mana-mana… tapi tidak menemukan apa-apa. 🤷")}\n` +
        "\n" +
        config.msg.footer
      );
    }
  }
};