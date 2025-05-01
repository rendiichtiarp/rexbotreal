const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

// prevent multiple games per chat
const sessions = new Map();

module.exports = {
  name: "doubleornothing",
  aliases: ["don"],
  category: "game",
  code: async (ctx) => {
    const chatId = ctx.id;
    if (sessions.has(chatId)) {
      return ctx.reply(quote(`🎮 Sesi permainan sedang berlangsung!`));
    }
    sessions.set(chatId, true);

    try {
      // parse bet
      const betArg = ctx.args[0];
      const bet = parseInt(betArg, 10);
      if (!betArg || isNaN(bet) || bet < 10) {
        sessions.delete(chatId);
        return ctx.reply(
          `${quote(`Penggunaan: ${monospace(ctx.used.prefix + ctx.used.command)} <taruhan (>=10)>`)}\n` +
          `${quote(`Contoh: ${monospace(ctx.used.prefix + ctx.used.command)} 100`)}\n` +
          `${quote(`💡 Tip: Semakin berani bertaruh, semakin besar potensi kemenangan!`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // load user balance
      const playerJid = ctx.sender.jid;
      const playerId = tools.general.getID(playerJid);
      const userDb = await Database.getUser(playerId);
      const balance = userDb?.coin || 0;

      if (balance < bet) {
        sessions.delete(chatId);
        return ctx.reply(
          `${quote(`❌ Koin tidak cukup!`)}\n` +
          `${quote(`💰 Koin Anda: ${monospace(balance + " koin")}`)}\n` +
          `${quote(`💳 Dibutuhkan: ${monospace(bet + " koin")}`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // deduct initial bet
      await Database.updateUser(playerId, { coin: balance - bet });
      let current = bet * 2; // first win would be double

      // perform first flip
      const win = Math.random() < 0.5;
      if (!win) {
        sessions.delete(chatId);
        return ctx.reply(
          `${quote(`🎲 Double or Nothing`)}\n` +
          `${quote(`💔 Anda kalah pada putaran pertama!`)}\n` +
          `${quote(`💸 Kehilangan: ${monospace(bet + " koin")}`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // on win, prompt for take or flip
      await ctx.reply(
        `${quote(`🎲 Double or Nothing`)}\n` +
        `${quote(`🎉 Selamat! Anda memenangkan putaran ini!`)}\n` +
        `${quote(`💰 Kemenangan saat ini: ${monospace(current + " koin")}`)}\n` +
        `${quote(`📢 Pilihan Anda:`)}\n` +
        `${quote(`• Ketik ${monospace("ambil")} untuk mengambil kemenangan`)}\n` +
        `${quote(`• Ketik ${monospace("double")} untuk menggandakan (50% peluang)`)}\n` +
        `${quote(`⏱️ Waktu: ${monospace("60 detik")}`)}\n` +
        "\n" +
        config.msg.footer
      );

      // collector for decisions
      const collector = ctx.MessageCollector({ time: 60000 });
      collector.on('collect', async m => {
        if (m.sender !== playerJid) return;
        const cmd = m.content.toLowerCase();
        if (cmd === 'ambil') {
          // Get latest balance before cash out
          const latestUser = await Database.getUser(playerId);
          const latestBalance = latestUser?.coin || 0;
          
          // cash out
          await Database.updateUser(playerId, { 
            coin: latestBalance + current,
            win_game: (latestUser?.win_game || 0) + 1
          });
          sessions.delete(chatId);
          await ctx.sendMessage(chatId, { 
            text: 
              `${quote(`🎲 Double or Nothing`)}\n` +
              `${quote(`🎉 Permainan Selesai!`)}\n` +
              `${quote(`💰 Anda mengambil: ${monospace(current + " koin")}`)}\n` +
              `${quote(`🏆 Selamat atas kemenangan Anda!`)}\n` +
              "\n" +
              config.msg.footer
          }, { quoted: m });
          collector.stop();
        } else if (cmd === 'double') {
          // attempt next flip
          const winNext = Math.random() < 0.5;
          if (!winNext) {
            sessions.delete(chatId);
            await ctx.sendMessage(chatId, { 
              text: 
                `${quote(`🎲 Double or Nothing`)}\n` +
                `${quote(`💥 Sayang sekali, Anda kalah!`)}\n` +
                `${quote(`💸 Kehilangan: ${monospace(current + " koin")}`)}\n` +
                `${quote(`🎯 Tip: Tahu kapan harus berhenti adalah kunci kemenangan!`)}\n` +
                "\n" +
                config.msg.footer
            }, { quoted: m });
            collector.stop();
          } else {
            // double current
            current *= 2;
            await ctx.sendMessage(chatId, { 
              text: 
                `${quote(`🎲 Double or Nothing`)}\n` +
                `${quote(`🎉 Selamat! Anda menang lagi!`)}\n` +
                `${quote(`💰 Kemenangan saat ini: ${monospace(current + " koin")}`)}\n` +
                `${quote(`📢 Pilihan Anda:`)}\n` +
                `${quote(`• Ketik ${monospace("ambil")} untuk mengambil kemenangan`)}\n` +
                `${quote(`• Ketik ${monospace("double")} untuk menggandakan lagi (50% peluang)`)}\n` +
                "\n" +
                config.msg.footer
            }, { quoted: m });
            // continue waiting for take or flip
          }
        }
      });

      collector.on('end', () => { 
        if (sessions.has(chatId)) {
          sessions.delete(chatId);
          return ctx.reply(
            `${quote(`🎲 Double or Nothing`)}\n` +
            `${quote(`⏱️ Waktu habis!`)}\n` +
            `${quote(`💰 Kemenangan ${monospace(current + " koin")} hangus!`)}\n` +
            `${quote(`❗ Lain kali bertindak lebih cepat!`)}\n` +
            "\n" +
            config.msg.footer
          );
        }
      });

    } catch (err) {
      sessions.delete(chatId);
      console.error(err);
      return tools.cmd.handleError(ctx, err, false);
    }
  }
};