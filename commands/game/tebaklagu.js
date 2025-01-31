const { monospace, quote } = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");
const userHelper = require('../../database/users');

const session = new Map();

module.exports = {
  name: "tebaklagu",
  category: "game",
  handler: {},
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    if (session.has(ctx.id))
      return await ctx.reply(quote(`🎯 Sesi permainan ini sedang berlangsung! Tunggu hingga selesai.`));

    try {
      const apiUrl = tools.api.createUrl("siputzx", "/api/games/tebaklagu");
      const { data } = (await axios.get(apiUrl)).data;

      const game = {
        coin: 25,
        timeout: 60000,
        senderId: ctx.sender.jid.split(/[:@]/)[0],
        answer: data.judul.toUpperCase(),
      };

      session.set(ctx.id, true);

      await ctx.reply({
        audio: {
          url: data.lagu,
        },
        mimetype: mime.lookup("mp3"),
      });
      await ctx.reply(
        `${quote(`Artis: ${data.artis}`)}\n` +
          `${quote(`Waktu: ${game.timeout / 1000} detik`)}\n` +
          `${quote(`Bonus: ${game.coin} Koin`)}\n` +
          `${quote("Ketik 'h' untuk petunjuk.")}\n` +
          `${quote("Ketik 's' untuk menyerah.")}\n` +
          "\n" +
          config.msg.footer
      );

      const collector = ctx.MessageCollector({
        time: game.timeout,
      });

      collector.on("collect", async (m) => {
        const userAnswer = m.content.toUpperCase();

        if (userAnswer === game.answer) {
          session.delete(ctx.id);

          await Promise.all([
            userHelper.addCoin(game.senderId, game.coin),
            userHelper.addWinGame(game.senderId),
          ]);
          await ctx.sendMessage(
            ctx.id,
            {
              text: `${quote("💯 Kamu benar!")}\n` + quote(`+${game.coin} Koin`),
            },
            {
              quoted: m,
            }
          );
          return collector.stop();
        } else if (userAnswer === "H") {
          const clue = game.answer.replace(/[AIUEO]/g, "_");
          await ctx.sendMessage(
            ctx.id,
            {
              text: monospace(clue),
            },
            {
              quoted: m,
            }
          );
        } else if (userAnswer === "S") {
          session.delete(ctx.id);
          await ctx.reply(
            `${quote("💭 Kamu menyerah!")}\n` +
              quote(`Jawaban: ${game.answer}.`)
          );
          return collector.stop();
        }
      });

      collector.on("end", async () => {
        const artist = data.artis;

        if (session.has(ctx.id)) {
          session.delete(ctx.id);
          return await ctx.reply(
            `${quote("⏰ Waktu kamu habis!")}\n` +
              quote(`Jawaban: ${game.answer} oleh ${artist}.`)
          );
        }
      });
    } catch (error) {
      if (session.has(ctx.id)) {
        session.delete(ctx.id);
      }
      consolefy.error(`Error: ${error}`);
      return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
    }
  },
};
