const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
  name: "upgradepickaxe",
  aliases: ["upickaxe", "upick"],
  category: "game",
  code: async (ctx) => {
    const userId = tools.general.getID(ctx.sender.jid);
    const input = ctx.args[0]?.toLowerCase() || null;

    // urutan level pickaxe dengan emoji
    const levels = ["stone", "iron", "golden", "iridium"];
    const levelEmojis = {
      stone: "🪨",
      iron: "⚔️",
      golden: "🌟",
      iridium: "💫"
    };
    
    // mapping upgrade: current → { next, price, multiplier }
    const upgradeMap = {
      stone:  { next: "iron",    price: 500,  multiplier: 1.2 },
      iron:   { next: "golden",  price: 2000, multiplier: 1.5 },
      golden: { next: "iridium", price: 8000, multiplier: 2.0 }
    };

    // .upick list: tampilkan shop pickaxe
    if (input === "list") {
      const listItems = levels.map(level => {
        const info = upgradeMap[level];
        if (info) {
          return `${levelEmojis[level]} ${monospace(level)} → ${levelEmojis[info.next]} ${monospace(info.next)} : ${info.price} koin (×${info.multiplier} mining bonus)`;
        }
        return `${levelEmojis[level]} ${monospace(level)} : MAX LEVEL`;
      }).join("\n");

      return ctx.reply(
        quote(`⛏️ Shop Pickaxe Upgrade:`) +
        `\n${listItems}` +
        `\n\n💡 Gunakan ${monospace(ctx.used.prefix + ctx.used.command + ' <level>')} untuk upgrade pickaxe.` +
        "\n" +
        config.msg.footer
      );
    }

    // fetch user data
    const userDb = await Database.getUser(userId);
    let current = userDb?.pickaxe?.toLowerCase();
    if (!current) {
      current = "stone";
      await Database.updateUser(userId, { pickaxe: current });
    }

    // tanpa arg: show status
    if (!input) {
      return ctx.reply(
        quote(`⛏️ Pickaxe saat ini: ${levelEmojis[current]} ${monospace(current)}`) +
        `\n💡 Gunakan ${monospace(ctx.used.prefix + ctx.used.command + ' list')} untuk daftar.` +
        "\n" +
        config.msg.footer
      );
    }

    // validasi level input
    if (!levels.includes(input)) {
      return ctx.reply(
        quote(`❎ Level '${input}' tidak valid!`) +
        "\n" +
        config.msg.footer
      );
    }

    const currentIndex = levels.indexOf(current);
    const targetIndex = levels.indexOf(input);

    // sudah di level ini
    if (targetIndex === currentIndex) {
      return ctx.reply(
        quote(`⚠️ Pickaxe-mu sudah di level ${levelEmojis[current]} ${monospace(current)}.`) +
        "\n" +
        config.msg.footer
      );
    }
    
    // skip level
    if (targetIndex > currentIndex + 1) {
      return ctx.reply(
        quote(`⚠️ Kamu tidak bisa lompat dari ${levelEmojis[current]} ${monospace(current)} ke ${levelEmojis[input]} ${monospace(input)}.`) +
        "\n" +
        config.msg.footer
      );
    }
    
    // downgrade
    if (targetIndex < currentIndex) {
      return ctx.reply(
        quote(`⚠️ Kamu tidak bisa menurunkan level pickaxe.`) +
        "\n" +
        config.msg.footer
      );
    }

    // proper upgrade
    const info = upgradeMap[current];
    const coins = userDb?.coin || 0;
    const isOwner = tools.general.isOwner(userId);
    const isPremium = userDb?.premium;
    let costMsg = "";

    if (!isOwner && !isPremium) {
      if (coins < info.price) {
        return ctx.reply(
          quote(`💔 Koinmu kurang! Butuh ${monospace(info.price)} untuk upgrade ke ${levelEmojis[info.next]} ${monospace(info.next)}.`) +
          "\n" +
          config.msg.footer
        );
      }
      await Database.updateUser(userId, {
        coin: coins - info.price,
        pickaxe: info.next
      });
      costMsg = `- ${monospace(info.price + ' koin')}`;
    } else {
      await Database.updateUser(userId, { pickaxe: info.next });
      costMsg = `🔓 Gratis upgrade untuk ${isOwner ? 'Owner' : 'Premium User'}!`;
    }

    return ctx.reply(
      quote(
        `✅ Upgrade sukses!` +
        `\n⛏️ Pickaxe-mu sekarang: ${levelEmojis[info.next]} ${monospace(info.next)}` +
        `\n💫 Bonus: ×${info.multiplier} mining rate` +
        `\n${costMsg}`
      ) +
      "\n" +
      config.msg.footer
    );
  }
};