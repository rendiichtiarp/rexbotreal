const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");
const session = new Map();

// rarities & rewards
const rarities = ["common", "uncommon", "rare", "epic", "mythic"];
const chanceTable = {
  bamboo:   { common: 70, uncommon: 20, rare: 8,  epic: 2,  mythic: 0 },
  iron:     { common: 60, uncommon: 25, rare: 10, epic: 4,  mythic: 1 },
  gold:     { common: 50, uncommon: 30, rare: 12, epic: 6,  mythic: 2 },
  iridium:  { common: 38, uncommon: 30, rare: 17, epic: 11, mythic: 4 },
};

const fishEmoji = {
  common: "🐟",
  uncommon: "🐠",
  rare: "🐡",
  epic: "🦈",
  mythic: "🐋"
};

const rewardTable = { 
  common: 5, 
  uncommon: 10, 
  rare: 25, 
  epic: 50, 
  mythic: 100 
};

const COOLDOWN = 1 * 60 * 1000; // 1 menit

function getFishRarity(rod) {
  const chances = chanceTable[rod] || chanceTable.bamboo;
  const roll = Math.random() * 100;
  let cum = 0;
  for (let r of rarities) {
    cum += chances[r];
    if (roll < cum) return r;
  }
  return "common";
}

module.exports = {
  name: "fish",
  aliases: ["mancing", "fishing"],
  category: "game",
  code: async (ctx) => { 
    const userId = tools.general.getID(ctx.sender.jid);
    const now = Date.now();

    // Ambil data user
    const userDb = await Database.getUser(userId);
    const last = userDb?.lastFishTime || 0;

    // Cek cooldown
    if (now - last < COOLDOWN) {
      const rem = Math.ceil((COOLDOWN - (now - last)) / 1000);
      return ctx.reply(
        `${quote(`🎣 Fishing Status:`)}\n` +
        `${quote(`⏳ Cooldown masih aktif!`)}\n` +
        `${quote(`🕔 Tunggu ${monospace(rem + "s")} lagi sebelum memancing.`)}\n` +
        "\n" +
        config.msg.footer
      );
    }

    // Ambil dan validasi rod level
    let rod = userDb?.rodlevel?.toLowerCase();
    if (!rod) {
      rod = "bamboo";
      await Database.updateUser(userId, { rodlevel: rod });
    }

    // fishing logic
    const rarity = getFishRarity(rod);
    const reward = rewardTable[rarity];
    const emoji = fishEmoji[rarity];

    // Update coin dan lastFishTime dalam satu transaksi
    await Database.updateUser(userId, {
      coin: (userDb?.coin || 0) + reward,
      lastFishTime: now
    });

    // Generate chance info
    const chanceInfo = Object.entries(chanceTable[rod])
      .map(([r, chance]) => `${fishEmoji[r]} ${r.charAt(0).toUpperCase() + r.slice(1)}: ${chance}%`)
      .join("\n");

    return ctx.reply(
      `${quote(`🎣 Hasil Memancing:`)}\n` +
      `${quote(`🎏 Rod: ${monospace(rod.toUpperCase())}`)}\n` +
      `${quote(`${emoji} Ikan: ${monospace(rarity.toUpperCase())}`)}\n` +
      `${quote(`💰 Reward: +${monospace(reward + " koin")}`)}\n` +
      `\n` +
      `${quote(`📊 Peluang dengan ${monospace(rod.toUpperCase())} rod:`)}\n` +
      chanceInfo.split('\n').map(line => quote(line)).join('\n') +
      "\n\n" +
      config.msg.footer
    );
  }
};