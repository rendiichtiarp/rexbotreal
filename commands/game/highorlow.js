const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

// Definisi area dan multiplier
const areas = {
  high: { range: "51-99", emoji: "⬆️", multiplier: 2 },
  middle: { range: "50", emoji: "↔️", multiplier: 100 },
  low: { range: "1-49", emoji: "⬇️", multiplier: 2 }
};

module.exports = {
  name: "highorlow",
  category: "game",
  aliases: ["hol"],
  code: async (ctx) => {
    try {
      const userJid = ctx.sender.jid;
      const userId = tools.general.getID(userJid);
      const [ amtArg, choiceArg ] = ctx.args;
      const amount = parseInt(amtArg, 10);
      const choice = choiceArg?.toLowerCase();

      // pengecekan penggunaan
      if (!amtArg || !choiceArg) {
        return ctx.reply(
          `${quote(`🎲 High-Middle-Low Game`)}\n` +
          `${quote(`📋 Cara Bermain:`)}\n` +
          `${quote(`1. Pilih jumlah taruhan (min. 10 koin)`)}\n` +
          `${quote(`2. Pilih area tebakan:`)}\n` +
          `${quote(`   ⬆️ HIGH (51-99) - Menang 2x`)}\n` +
          `${quote(`   ↔️ MIDDLE (50) - Menang 100x`)}\n` +
          `${quote(`   ⬇️ LOW (1-49) - Menang 2x`)}\n` +
          `${quote(`📢 Format: ${monospace(ctx.used.prefix + ctx.used.command)} <jumlah> <high/middle/low>`)}\n` +
          `${quote(`💡 Contoh: ${monospace(ctx.used.prefix + ctx.used.command)} 100 high`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // validasi jumlah
      if (isNaN(amount) || amount < 10) {
        return ctx.reply(
          `${quote(`❌ Error:`)}\n` +
          `${quote(`💰 Taruhan minimal adalah ${monospace("10 koin")}!`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // validasi pilihan
      if (!Object.keys(areas).includes(choice)) {
        return ctx.reply(
          `${quote(`❌ Error:`)}\n` +
          `${quote(`🎯 Pilihan harus ${monospace("high")}, ${monospace("middle")}, atau ${monospace("low")}!`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // muat data pengguna
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

      // undi nomor acak 1-99
      const result = Math.floor(Math.random() * 99) + 1;
      let area;
      if (result > 50) area = "high";
      else if (result < 50) area = "low";
      else area = "middle"; // tepat 50

      // tentukan menang atau kalah dan pembayaran
      const isWin = choice === area;
      const multiplier = areas[area].multiplier;
      const payout = isWin ? amount * multiplier : -amount;
      const newCoin = coin + payout;

      // Update coin dalam satu transaksi
      await Database.updateUser(userId, { 
        coin: newCoin,
        win_game: isWin ? (userDb?.win_game || 0) + 1 : (userDb?.win_game || 0)
      });

      return ctx.reply(
        `${quote(`🎲 High-Middle-Low Game`)}\n` +
        `${quote(`🎯 Pilihan Anda: ${areas[choice].emoji} ${choice.toUpperCase()} (${areas[choice].range})`)}\n` +
        `${quote(`🎲 Hasil: ${monospace(result.toString())} ${areas[area].emoji} ${area.toUpperCase()}`)}\n` +
        `${quote(isWin ? `🎉 MENANG!` : `💔 KALAH!`)}\n` +
        `${quote(`💰 ${isWin ? "Kemenangan" : "Kerugian"}: ${monospace(Math.abs(payout) + " koin")}`)}\n` +
        (isWin ? `${quote(`✨ Multiplier: ${monospace(multiplier + "x")}`)}\n` : "") +
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