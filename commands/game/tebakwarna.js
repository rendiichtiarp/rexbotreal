const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

const session = new Map();

module.exports = {
    name: "tebakwarna",
    category: "game",
    permissions: {},
    code: async (ctx) => {
        if (session.has(ctx.id)) return await ctx.reply(quote(`🎮 Sesi permainan sedang berjalan!`));

        try {
            const apiUrl = tools.api.createUrl("siputzx", "/api/games/tebakwarna");
            const { data } = (await axios.get(apiUrl)).data;

            const game = {
                coin: 20,
                timeout: 60000,
                senderId: tools.general.getID(ctx.sender.jid),
                answer: data.correct.toLowerCase()
            };

            session.set(ctx.id, true);

            await ctx.reply({
                image: {
                    url: data.image,
                },
                mimetype: mime.lookup("png"),
                caption:
                    `${quote(`Bonus: ${game.coin} Koin`)}\n` +
                    `${quote(`Batas waktu: ${tools.general.convertMsToDuration(game.timeout)}`)}\n` +
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
                    
                    await Database.addGameReward(game.senderId, game.coin);
                    
                    await ctx.sendMessage(
                        ctx.id, {
                            text: `${quote("💯 Benar!")}\n` +
                                quote(`+${game.coin} Koin`)
                        }, {
                            quoted: m
                        }
                    );
                    return collector.stop();
                } else if (userAnswer === "s") {
                    session.delete(ctx.id);
                    await ctx.reply(
                        `${quote("🏳️ Anda menyerah!")}\n` +
                        quote(`Jawabannya adalah ${tools.general.ucword(game.answer)}.`)
                    );
                    return collector.stop();
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
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
