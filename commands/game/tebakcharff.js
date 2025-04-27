const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");
const didYouMean = require("didyoumean");

const session = new Map();

module.exports = {
    name: "charff",
    category: "game",
    permissions: {},
    code: async (ctx) => {
        if (session.has(ctx.id)) return await ctx.reply(quote(`🎮 Sesi permainan sedang berjalan!`));

        try {
            const apiUrl = tools.api.createUrl("siputzx", "/api/games/karakter-freefire");
            const { data } = (await axios.get(apiUrl)).data;

            const game = {
                startTime: Date.now(),
                timeout: 60000,
                senderId: tools.general.getID(ctx.sender.jid),
                answer: data.name.toLowerCase()
            };

            session.set(ctx.id, true);

            await ctx.reply({
                image: {
                    url: data.gambar,
                },
                mimetype: mime.lookup("png"),
                caption:
                    `${quote(`Bonus: 20 Koin (Akan berkurang berdasarkan waktu)`)}\n` +
                    `${quote(`Batas waktu: ${tools.general.convertMsToDuration(game.timeout)}`)}\n` +
                    `${quote("Ketik 'h' untuk bantuan.")}\n` +
                    `${quote("Ketik 's' untuk menyerah.")}\n` +
                    "\n" +
                    config.msg.footer,
            });

            const collector = ctx.MessageCollector({
                time: game.timeout
            });

            collector.on("collect", async (m) => {
                const userAnswer = m.content.toLowerCase();

                if (userAnswer === game.answer) {
                    session.delete(ctx.id);
                    
                    const earnedCoin = tools.general.calculateTimeBasedCoin(game.startTime, Date.now());
                    const validCoin = Number.isFinite(earnedCoin) ? Math.max(0, Math.floor(earnedCoin)) : 20;
                    await Database.addGameReward(game.senderId, validCoin);
                    
                    await ctx.sendMessage(
                        ctx.id, {
                            text: `${quote("💯 Benar!")}\n` +
                                quote(`+${validCoin} Koin (Waktu: ${tools.general.convertMsToDuration(Date.now() - game.startTime)})`)
                        }, {
                            quoted: m
                        }
                    );
                    return collector.stop();
                } else if (userAnswer === "h") {
                    const clue = game.answer.replace(/[aiueo]/g, "_");
                    await ctx.sendMessage(
                        ctx.id, {
                            text: monospace(clue.toUpperCase())
                        }, {
                            quoted: m
                        }
                    );
                } else if (userAnswer === "s") {
                    session.delete(ctx.id);
                    await ctx.sendMessage(ctx.id, {
                         text: `${quote("🏳️ Anda menyerah!")}\n` +
                             quote(`Jawabannya adalah ${tools.general.ucword(game.answer)}.`)
                     }, {
                         quoted: m
                     });
                    return collector.stop();
                } else if (didYouMean(userAnswer, [game.answer]) === game.answer) {
                    await ctx.sendMessage(ctx.id, {
                         text: quote("🎯 Sedikit lagi!")
                     }, {
                         quoted: m
                     });
                }
            });

            collector.on("end", async () => {
                if (session.has(ctx.id)) {
                    session.delete(ctx.id);
                    return await ctx.reply(
                        `${quote("⏱ Waktu habis!")}\n` +
                        quote(`Jawabannya adalah ${tools.general.ucword(game.answer)}.`)
                    );
                }
            });
        } catch (error) {
            if (session.has(ctx.id)) {
                session.delete(ctx.id);
            }
           return await tools.cmd.handleError(ctx, error, true);
        }
    }
};
