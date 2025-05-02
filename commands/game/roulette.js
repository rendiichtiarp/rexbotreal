const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

const MAX_BET = 1000;
const MIN_BET = 10;

// Definisi warna roulette
const colors = {
  merah: {
    emoji: "🔴",
    name: "MERAH",
    chance: "50%"
  },
  hitam: {
    emoji: "⚫",
    name: "HITAM",
    chance: "50%"
  }
};

module.exports = {
  name: "roulette",
  category: "game",
  aliases: ["roll", "rj"],
  code: async (ctx) => {
    try {
      const userJid = ctx.sender.jid;
      const userId = tools.general.getID(userJid);
      const [ amtArg, colorArg ] = ctx.args;
      const amount = parseInt(amtArg, 10);
      const color = colorArg?.toLowerCase();

      // usage check
      if (!amtArg || !colorArg) {
        return ctx.reply(
          `${quote(`🎲 Roulette Game`)}\n` +
          `${quote(`📋 Cara Bermain:`)}\n` +
          `${quote(`1. Pilih jumlah taruhan (${monospace(MIN_BET)}-${monospace(MAX_BET)} koin)`)}\n` +
          `${quote(`2. Pilih warna taruhan:`)}\n` +
          `${quote(`   🔴 MERAH - Peluang ${colors.merah.chance}`)}\n` +
          `${quote(`   ⚫ HITAM - Peluang ${colors.hitam.chance}`)}\n` +
          `${quote(`📢 Format: ${monospace(ctx.used.prefix + ctx.used.command)} <jumlah> <merah/hitam>`)}\n` +
          `${quote(`💡 Contoh: ${monospace(ctx.used.prefix + ctx.used.command)} 100 merah`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // validation
      if (isNaN(amount) || amount < MIN_BET) {
        return ctx.reply(
          `${quote(`❌ Error:`)}\n` +
          `${quote(`💰 Taruhan minimal adalah ${monospace(MIN_BET + " koin")}!`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      if (!Object.keys(colors).includes(color)) {
        return ctx.reply(
          `${quote(`❌ Error:`)}\n` +
          `${quote(`🎯 Warna harus ${monospace("merah")} atau ${monospace("hitam")}!`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // load user data
      const userDb = await Database.getUser(userId);
      const coin = userDb?.coin || 0;

      if (coin < amount) {
        return ctx.reply(
          `${quote(`❌ Error:`)}\n` +
          `${quote(`💰 Koin Anda: ${monospace(coin + " koin")}`)}\n` +
          `${quote(`💳 Dibutuhkan: ${monospace(amount + " koin")}`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      if (amount > MAX_BET) {
        return ctx.reply(
          `${quote(`❌ Error:`)}\n` +
          `${quote(`💰 Maksimal taruhan adalah ${monospace(MAX_BET + " koin")}!`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // spin roulette immediately
      const result = Math.random() < 0.5 ? "merah" : "hitam";
      const isWin = color === result;
      const newCoin = coin + (isWin ? amount : -amount);

      // Update coin dan win_game dalam satu transaksi
      await Database.updateUser(userId, {
        coin: newCoin,
        win_game: isWin ? (userDb?.win_game || 0) + 1 : (userDb?.win_game || 0)
      });

      return ctx.reply(
        `${quote(`🎲 Hasil Roulette:`)}\n` +
        `${quote(`🎯 Pilihan Anda: ${colors[color].emoji} ${colors[color].name}`)}\n` +
        `${quote(`🎲 Hasil: ${colors[result].emoji} ${colors[result].name}`)}\n` +
        `${quote(isWin ? `🎉 MENANG!` : `💔 KALAH!`)}\n` +
        `${quote(`💰 ${isWin ? "Kemenangan" : "Kerugian"}: ${monospace(amount + " koin")}`)}\n` +
        `${quote(`💳 Saldo: ${monospace(newCoin + " koin")}`)}\n` +
        "\n" +
        config.msg.footer
      );

    } catch (err) {
      console.error(err);
      return await tools.cmd.handleError(ctx, err, false);
    }
  }
};