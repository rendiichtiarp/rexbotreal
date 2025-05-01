const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

const COOLDOWN = 60 * 1000; // 1 menit
const MIN_AMOUNT = 0;
const MAX_AMOUNT = 5;

// Definisi kategori pesan dengan emoji
const messageCategories = {
  luck: {
    emoji: "🍀",
    messages: [
      "Kamu nemu koin di jalanan",
      "Eh, ada koin di saku bajumu yang lupa kamu simpan",
      "Kamu nemu dompet tua, isinya cuma beberapa koin",
      "Recehan di kolong kursi bioskop kamu kumpulkan",
      "Koin jatuh dari langit… atau itu cuma hujan, ya recehan doang"
    ]
  },
  kindness: {
    emoji: "💝",
    messages: [
      "Seorang dermawan memberimu beberapa koin",
      "Orang baik hati melewatimu dan memberimu sedikit koin",
      "Nenek-nenek baik hati ngasih koin karena kasihan",
      "Seorang pejalan kaki membantumu dengan koin",
      "Orang lewat memasukkan koin ke embermu"
    ]
  },
  animals: {
    emoji: "🐱",
    messages: [
      "Kucing lucu menatapmu sedih, dia merasa kasihan kepadamu",
      "Anjing lucu bawa koin jatuh di depanmu",
      "Burung merpati menjatuhkan koin di dekatmu",
      "Hamster tetangga memberimu koin dari kantongnya",
      "Kelinci putih menuntunmu ke tumpukan koin"
    ]
  },
  mystery: {
    emoji: "✨",
    messages: [
      "Misterius! Sebuah kantong kecil berisi beberapa koin muncul",
      "Sekotak koin jatuh ke pangkuanmu",
      "Tok! Pintu jarimu ketukan, ada koin mampir ke saku",
      "Seseorang ga ada yang ngambil, jadi aku kasih ke kamu",
      "Temenmu nitip koin tapi lupa ambil, akhirnya jadi milikmu"
    ]
  }
};

module.exports = {
  name: "minta",
  aliases: ["beg"],
  category: "game",
  code: async (ctx) => {
    const userJid = ctx.sender.jid;
    const userId = tools.general.getID(userJid);
    const now = Date.now();

    // Ambil data user
    const userDb = await Database.getUser(userId);
    const lastBeg = userDb?.lastBeg || 0;

    // cek cooldown
    if (now - lastBeg < COOLDOWN) {
      const remMs = COOLDOWN - (now - lastBeg);
      const seconds = Math.ceil(remMs / 1000);
      
      return ctx.reply(
        `${quote(`🙏 Status Meminta:`)}\n` +
        `${quote(`⏳ Cooldown masih aktif!`)}\n` +
        `${quote(`⏱️ Waktu tersisa: ${monospace(seconds + "s")}`)}\n` +
        `${quote(`🔄 Minta lagi dalam: ${monospace(seconds + "s")}`)}\n` +
        "\n" +
        config.msg.footer
      );
    }

    // Pilih kategori random
    const categories = Object.keys(messageCategories);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const category = messageCategories[randomCategory];
    
    // Pilih pesan random dari kategori
    const msg = category.messages[Math.floor(Math.random() * category.messages.length)];
    
    // Random amount
    const amount = Math.floor(Math.random() * (MAX_AMOUNT - MIN_AMOUNT + 1)) + MIN_AMOUNT;

    // Update coin dan lastBeg dalam satu transaksi
    await Database.updateUser(userId, {
      coin: (userDb?.coin || 0) + amount,
      lastBeg: now
    });

    return ctx.reply(
      `${quote(`🙏 Hasil Meminta:`)}\n` +
      `${quote(`${category.emoji} ${msg}!`)}\n` +
      `${quote(`💰 Dapat: ${monospace(amount + " koin")}`)}\n` +
      `${quote(`💳 Saldo: ${monospace((userDb?.coin || 0) + amount + " koin")}`)}\n` +
      "\n" +
      `${quote(`💡 Tip: Coba cara lain untuk dapat koin lebih banyak!`)}\n` +
      "\n" +
      config.msg.footer
    );
  }
};