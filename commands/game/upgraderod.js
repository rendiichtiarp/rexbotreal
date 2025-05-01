const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
  name: "upgraderod",
  aliases: ["uprod"],
  category: "game",
  code: async (ctx) => {
    const userId = tools.general.getID(ctx.sender.jid);
    const input = ctx.args[0]?.toLowerCase() || null;

    // Define all rod levels in order with emoji
    const levels = ["bamboo", "iron", "gold", "iridium"];
    const levelEmojis = {
      bamboo: "🎋",
      iron: "⚔️",
      gold: "🏆",
      iridium: "💫"
    };
    
    // Mapping upgrade: current → { next level, price }
    const upgradeMap = {
      bamboo:  { next: "iron",    price: 300,  multiplier: 1.2 },
      iron:    { next: "gold",    price: 1800, multiplier: 1.5 },
      gold:    { next: "iridium", price: 5200, multiplier: 2.0 }
    };

    // List command: show shop-like list of rods with upgrade prices
    if (input === "list") {
      const listItems = levels.map(level => {
        const info = upgradeMap[level];
        if (info) {
          return `${levelEmojis[level]} ${monospace(level)} → ${levelEmojis[info.next]} ${monospace(info.next)} : ${info.price} koin (×${info.multiplier} catch bonus)`;
        }
        return `${levelEmojis[level]} ${monospace(level)} : MAX LEVEL`;
      }).join("\n");

      return ctx.reply(
        quote(`🎣 Shop Rod Upgrade:`) +
        `\n${listItems}` +
        `\n\n💡 Gunakan ${monospace(ctx.used.prefix + ctx.used.command + ' <level>')} untuk upgrade rod.` +
        "\n" +
        config.msg.footer
      );
    }

    // Fetch user data
    const userDb = await Database.getUser(userId);
    let current = userDb?.rodlevel?.toLowerCase();
    if (!current) {
      current = "bamboo";
      await Database.updateUser(userId, { rodlevel: current });
    }

    // If user asked status (no args)
    if (!input) {
      return ctx.reply(
        quote(`🎣 Rod saat ini: ${levelEmojis[current]} ${monospace(current)}`) +
        `\n💡 Gunakan ${monospace(ctx.used.prefix + ctx.used.command + ' list')} untuk daftar.` +
        "\n" +
        config.msg.footer
      );
    }

    // Validate desired level
    if (!levels.includes(input)) {
      return ctx.reply(
        quote(`❎ Level '${input}' tidak valid!`) +
        "\n" +
        config.msg.footer
      );
    }

    const currentIndex = levels.indexOf(current);
    const targetIndex = levels.indexOf(input);

    // Already at this level
    if (targetIndex === currentIndex) {
      return ctx.reply(
        quote(`⚠️ Rod-mu sudah di level ${levelEmojis[current]} ${monospace(current)}.`) +
        "\n" +
        config.msg.footer
      );
    }

    // Cannot skip levels
    if (targetIndex > currentIndex + 1) {
      return ctx.reply(
        quote(`⚠️ Kamu tidak bisa lompat dari ${levelEmojis[current]} ${monospace(current)} ke ${levelEmojis[input]} ${monospace(input)}.`) +
        "\n" +
        config.msg.footer
      );
    }

    // No downgrades
    if (targetIndex < currentIndex) {
      return ctx.reply(
        quote(`⚠️ Kamu tidak bisa menurunkan level rod.`) +
        "\n" +
        config.msg.footer
      );
    }

    // Now targetIndex === currentIndex + 1: valid upgrade
    const info = upgradeMap[current];
    const coins = userDb?.coin || 0;
    const isOwner = tools.general.isOwner(userId);
    const isPremium = userDb?.premium;

    let costMsg = "";

    if (!isOwner && !isPremium) {
      // Check coins
      if (coins < info.price) {
        return ctx.reply(
          quote(`💔 Koinmu kurang! Butuh ${monospace(info.price)} untuk upgrade ke ${levelEmojis[info.next]} ${monospace(info.next)}.`) +
          "\n" +
          config.msg.footer
        );
      }
      await Database.updateUser(userId, { 
        coin: coins - info.price,
        rodlevel: info.next
      });
      costMsg = `- ${monospace(info.price + ' koin')}`;
    } else {
      await Database.updateUser(userId, { rodlevel: info.next });
      costMsg = `🔓 Gratis upgrade untuk ${isOwner ? 'Owner' : 'Premium User'}!`;
    }

    // Confirm
    return ctx.reply(
      quote(
        `✅ Upgrade sukses!` +
        `\n🎣 Rod-mu sekarang: ${levelEmojis[info.next]} ${monospace(info.next)}` +
        `\n💫 Bonus: ×${info.multiplier} catch rate` +
        `\n${costMsg}`
      ) +
      "\n" +
      config.msg.footer
    );
  }
};