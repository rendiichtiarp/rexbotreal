const { monospace, quote } = require("@mengkodingan/ckptw");
const axios = require("axios");

const session = new Map();

module.exports = {
  name: "caklontong",
  category: "game",
  handler: {},
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    if (session.has(ctx.id))
      return await ctx.reply(quote(`🎯 Sesi permainan ini sedang berlangsung! Tunggu hingga selesai.`));

    try {
      const apiUrl = tools.api.createUrl("siputzx", "/api/games/caklontong");
      const { data } = (await axios.get(apiUrl)).data;

      const game = {
        coin: 5,
        timeout: 60000,
        senderId: ctx.sender.jid.split(/[:@]/)[0],
        answer: data.jawaban.toUpperCase(),
      };

      session.set(ctx.id, true);

      await ctx.reply(
        `${quote(`Soal: ${data.soal}`)}\n` +
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

          const updatedUserDb = await db.get(`user.${game.senderId}`) || {};
          
          await Promise.all([
            db.set(`user.${game.senderId}.coin`, (updatedUserDb?.coin || 0) + game.coin),
            await db.add(`user.${game.senderId}.winGame`, 1),
          ]);
          await ctx.sendMessage(
            ctx.id,
            {
              text:
                `${quote("💯 Kamu benar!")}\n` +
                `${quote(data.deskripsi)}\n` +
                quote(`+${game.coin} Koin`),
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
        const description = data.deskripsi;

        if (session.has(ctx.id)) {
          session.delete(ctx.id);
          return await ctx.reply(
            `${quote("⏰ Waktu kamu habis!")}\n` +
              `${quote(`Jawaban: ${game.answer}.`)}\n` +
              quote(description)
          );
        }
      });
    } catch (error) {
      if (session.has(ctx.id)) {
        session.delete(ctx.id);
        console.error(`[${config.pkg.name}] Error:`, error);
        return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
      }
    }
  },
};
