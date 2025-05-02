const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

const COOLDOWN = 5 * 60 * 1000; // 5 menit
const COIN_PER_BLOCK = 6;

// Definisi pickaxe dan propertinya
const pickaxes = {
  stone: {
    emoji: "⛏️",
    name: "STONE",
    minBlocks: 1,
    maxBlocks: 3,
    color: "⚫"
  },
  iron: {
    emoji: "⚒️",
    name: "IRON",
    minBlocks: 2,
    maxBlocks: 5,
    color: "⚪"
  },
  golden: {
    emoji: "🔨",
    name: "GOLDEN",
    minBlocks: 3,
    maxBlocks: 8,
    color: "🟡"
  },
  iridium: {
    emoji: "🛠️",
    name: "IRIDIUM",
    minBlocks: 4,
    maxBlocks: 12,
    color: "🟣"
  }
};

module.exports = {
  name: "mine",
  aliases: ["tambang", "mining"],
  category: "game",
  code: async (ctx) => {
    const userId = tools.general.getID(ctx.sender.jid);
    const now = Date.now();

    // Ambil data user
    const userDb = await Database.getUser(userId);
    const last = userDb?.lastMineTime || 0;

    // Cek cooldown
    if (now - last < COOLDOWN) {
      const remMs = COOLDOWN - (now - last);
      const minutes = Math.floor(remMs / (60 * 1000));
      const seconds = Math.ceil((remMs % (60 * 1000)) / 1000);
      
      return ctx.reply(
        `${quote(`⛏️ Status Mining:`)}\n` +
        `${quote(`⏳ Cooldown masih aktif!`)}\n` +
        `${quote(`⏱️ Waktu tersisa: ${monospace(minutes + "m " + seconds + "s")}`)}\n` +
        `${quote(`🔄 Mining lagi dalam: ${monospace(Math.ceil(remMs/1000) + "s")}`)}\n` +
        "\n" +
        config.msg.footer
      );
    }

    // Ambil dan validasi jenis pickaxe
    let pickaxe = userDb?.pickaxe?.toLowerCase();
    if (!pickaxe || !pickaxes[pickaxe]) {
      pickaxe = "stone";
      await Database.updateUser(userId, { pickaxe: pickaxe });
    }

    const pickaxeInfo = pickaxes[pickaxe];
    
    // Hitung blocks yang didapat
    const blocks = Math.floor(Math.random() * (pickaxeInfo.maxBlocks - pickaxeInfo.minBlocks + 1)) + pickaxeInfo.minBlocks;
    const reward = blocks * COIN_PER_BLOCK;

    // Update coin dan lastMineTime dalam satu transaksi
    await Database.updateUser(userId, {
      coin: (userDb?.coin || 0) + reward,
      lastMineTime: now
    });

    // Generate block display
    const blockDisplay = pickaxeInfo.color.repeat(blocks);

    return ctx.reply(
      `${quote(`⛏️ Hasil Mining:`)}\n` +
      `${quote(`${pickaxeInfo.emoji} Pickaxe: ${monospace(pickaxeInfo.name)}`)}\n` +
      `${quote(`🎯 Range: ${monospace(pickaxeInfo.minBlocks + "-" + pickaxeInfo.maxBlocks)} blocks`)}\n` +
      `${quote(`📦 Blocks: ${blockDisplay} (${monospace(blocks + "x")})`)}\n` +
      `${quote(`💰 Reward: +${monospace(reward + " koin")} (${monospace(COIN_PER_BLOCK + "/block")})`)}\n` +
      "\n" +
      `${quote(`💡 Tip: Upgrade pickaxe untuk mendapat blocks lebih banyak!`)}\n` +
      "\n" +
      config.msg.footer
    );
  },
};