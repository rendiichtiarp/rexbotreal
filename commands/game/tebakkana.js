const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const didYouMean = require("didyoumean");

const session = new Map();

module.exports = {
    name: "tebakkana",
    category: "game",
    permissions: {},
    code: async (ctx) => {
        const arg = (ctx.args[0] || '').toLowerCase();
        const levelMap = { n5: 5, n4: 4, n3: 3, n2: 2, n1: 1 };
        const lvl = levelMap[arg];
        
        if (!lvl) return await ctx.reply(`${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "n5"))}\n` +
            `${quote(tools.cmd.generateNotes(["Level: n5, n4, n3, n2, n1"]))}`);

        if (session.has(ctx.id)) return await ctx.reply(quote("🎮 Sesi permainan sedang berjalan!"));

        try {
            const apiUrl = tools.api.createUrl("https://jlpt-vocab-api.vercel.app", `/api/words?level=${lvl}&limit=662`);
            const response = await axios.get(apiUrl);
            const pool = response.data.words;

            if (!pool.length) return await ctx.reply(quote(`❎ Tidak ada data untuk level ${arg}`));

            const entry = tools.general.getRandomElement(pool);
            const toRomaji = Math.random() < 0.5;
            let question, answer, hint;

            if (toRomaji) {
                question = `Apa romaji untuk: ${entry.furigana || entry.word}`;
                answer = entry.romaji;
                hint = entry.romaji.replace(/[aiueo]/g, '_');
            } else {
                question = `Tulis kana untuk romaji: ${entry.romaji}`;
                answer = entry.furigana || entry.word;
                hint = answer.replace(/[あいうえおアイウエオ]/g, '_');
            }

            const game = {
                startTime: Date.now(),
                timeout: 60000,
                senderId: tools.general.getID(ctx.sender.jid),
                answer: answer.toLowerCase(),
                meaning: entry.meaning
            };

            session.set(ctx.id, true);

            await ctx.reply(
                `${quote(`Soal: ${question}`)}\n` +
                `${quote(`Bonus: 20 Koin (Akan berkurang berdasarkan waktu)`)}\n` +
                `${quote(`Batas waktu: ${tools.general.convertMsToDuration(game.timeout)}`)}\n` +
                `${quote("Ketik 'h' untuk bantuan.")}\n` +
                `${quote("Ketik 's' untuk menyerah.")}\n` +
                "\n" +
                config.msg.footer
            );

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
                                quote(`+${validCoin} Koin (Waktu: ${tools.general.convertMsToDuration(Date.now() - game.startTime)})`) +
                                quote(`\n${game.answer} (${game.meaning})`)
                        }, {
                            quoted: m
                        }
                    );
                    return collector.stop();
                } else if (userAnswer === "h") {
                    await ctx.sendMessage(ctx.id, {
                        text: monospace(hint.toUpperCase())
                    }, {
                        quoted: m
                    });
                } else if (userAnswer === "s") {
                    session.delete(ctx.id);
                    await ctx.sendMessage(ctx.id, {
                        text: `${quote("🏳️ Anda menyerah!")}\n` +
                            quote(`Jawabannya adalah ${game.answer} (${game.meaning}).`)
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
                        quote(`Jawabannya adalah ${game.answer} (${game.meaning}).`)
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