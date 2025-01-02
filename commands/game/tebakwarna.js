const { monospace, quote } = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

const session = new Map();

module.exports = {
  name: "tebakwarna",
  category: "game",
  handler: {},
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    if (session.has(ctx.id))
      return await ctx.reply(quote(`🎮 Sesi permainan sedang berjalan!`));

    try {
      const apiUrl = tools.api.createUrl("siputzx", "/api/games/tebakwarna");
      const { data } = (await axios.get(apiUrl)).data;

      const game = {
        coin: 5,
        timeout: 60000,
        senderId: ctx.sender.jid.split(/[:@]/)[0],
        answer: data.correct,
      };

      session.set(ctx.id, true);

      await ctx.reply({
        image: {
          url: data.image,
        },
        mimetype: mime.lookup("png"),
        caption:
          `${quote(`Bonus: ${game.coin} Koin`)}\n` +
          `${quote(`Batas waktu: ${game.timeout / 1000} detik`)}\n` +
          `${quote("Ketik 'surrender' untuk menyerah.")}\n` +
          "\n" +
          config.msg.footer,
      });

      const collector = ctx.MessageCollector({
        time: game.timeout,
      });

      collector.on("collect", async (m) => {
        const userAnswer = m.content;

        if (userAnswer === game.answer) {
          session.delete(ctx.id);
          await Promise.all([
            await db.add(`user.${game.senderId}.coin`, game.coin),
            await db.add(`user.${game.senderId}.winGame`, 1),
          ]);
          await ctx.sendMessage(
            ctx.id,
            {
              text: `${quote("💯 Benar!")}\n` + quote(`+${game.coin} Koin`),
            },
            {
              quoted: m,
            }
          );
          return collector.stop();
        } else if (userAnswer === "SURRENDER") {
          session.delete(ctx.id);
          await ctx.reply(
            `${quote("🏳️ Anda menyerah!")}\n` +
              quote(`Jawabannya adalah ${game.answer}.`)
          );
          return collector.stop();
        }
      });

      collector.on("end", async () => {
        if (session.has(ctx.id)) {
          session.delete(ctx.id);

          return await ctx.reply(
            `${quote("⏱ Waktu habis!")}\n` +
              quote(`Jawabannya adalah ${game.answer}.`)
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
