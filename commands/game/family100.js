const { monospace, quote } = require("@mengkodingan/ckptw");
const axios = require("axios");

const session = new Map();

module.exports = {
  name: "family100",
  category: "game",
  handler: {
    group: true,
  },
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    if (session.has(ctx.id))
      return await ctx.reply(quote(`🎯 Sesi permainan ini sedang berlangsung! Tunggu hingga selesai.`));

    try {
      const apiUrl = tools.api.createUrl("siputzx", "/api/games/family100");
      const { data } = (await axios.get(apiUrl)).data;

      const game = {
        coin: {
          answered: 5,
          allAnswered: 50,
        },
        timeout: 90000,
        senderId: ctx.sender.jid.split(/[:@]/)[0],
        answers: new Set(data.jawaban.map((d) => d.toUpperCase())),
        participants: new Set(),
      };

      session.set(ctx.id, true);

      await ctx.reply(
        `${quote(`Soal: ${data.soal}`)}\n` +
          `${quote(`Jumlah jawaban: ${game.answers.size}`)}\n` +
          `${quote(`Waktu ${game.timeout / 1000} detik`)}\n` +
          `${quote("Ketik 's' untuk menyerah.")}\n` +
          "\n" +
          config.msg.footer
      );

      const collector = ctx.MessageCollector({
        time: game.timeout,
      });

      collector.on("collect", async (m) => {
        const userAnswer = m.content.toUpperCase();
        const participantJid = m.jid;
        const participantId = participantJid.split("@")[0];

        if (game.answers.has(userAnswer)) {
          game.answers.delete(userAnswer);
          game.participants.add(participantId);

          await db.add(`user.${participantId}.coin`, game.coin.answered);
          await ctx.sendMessage(
            ctx.id,
            {
              text: quote(
                `💯 ${tools.general.ucword(
                  userAnswer
                )} Kamu benar! Jawaban tersisa: ${game.answers.size}`
              ),
            },
            {
              quoted: m,
            }
          );

          if (game.answers.size === 0) {
            session.delete(ctx.id);
            for (const participant of game.participants) {
              await db.add(`user.${participant}.coin`, game.coin.allAnswered);
              await db.add(`user.${participant}.winGame`, 1);
            }
            await ctx.reply(
              quote(
                `🎉 Selamat! Semua jawaban telah terjawab! Setiap anggota yang menjawab mendapat ${game.coin.allAnswered} koin.`
              )
            );
            return collector.stop();
          }
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
        const remaining = [...game.answers]
          .map(tools.general.ucword)
          .join(", ")
          .replace(/, ([^,]*)$/, ", dan $1");

        if (session.has(ctx.id)) {
          session.delete(ctx.id);
          return await ctx.reply(
            `${quote("⏰ Waktu kamu habis!")}\n` +
              quote(`Jawaban yang belum terjawab adalah: ${remaining}`)
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
