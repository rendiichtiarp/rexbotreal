const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

const session = new Map();

module.exports = {
    name: "family100",
    category: "game",
    permissions: {
        group: true
    },
    code: async (ctx) => {
        if (session.has(ctx.id)) return await ctx.reply(quote(`🎮 Sesi permainan sedang berjalan!`));

        try {
            const apiUrl = tools.api.createUrl("https://raw.githubusercontent.com", "/BochilTeam/database/refs/heads/master/games/family100.json");
            const result = tools.general.getRandomElement((await axios.get(apiUrl)).data);

            const game = {
                startTime: Date.now(),
                timeout: 60000,
                participants: new Set(),
                answers: new Set(result.jawaban.map(j => j.toLowerCase())),
                senderId: tools.general.getID(ctx.sender.jid),
                allAnsweredBonus: 50 // Bonus tetap untuk semua partisipan jika semua terjawab
            };

            session.set(ctx.id, true);

            await ctx.reply(
                `${quote(`Soal: ${result.soal}`)}\n` +
                `${quote(`Terdapat ${result.jawaban.length} jawaban`)}\n` +
                `${quote(`Bonus per jawaban: 20 Koin (Akan berkurang berdasarkan waktu)`)}\n` +
                `${quote(`Bonus tambahan jika semua terjawab: ${game.allAnsweredBonus} Koin`)}\n` +
                `${quote(`Batas waktu: ${tools.general.convertMsToDuration(game.timeout)}`)}\n` +
                `${quote("Ketik 's' untuk menyerah.")}\n` +
                "\n" +
                config.msg.footer
            );

            const collector = ctx.MessageCollector({
                time: game.timeout
            });

            collector.on("collect", async (m) => {
                const userAnswer = m.content.toLowerCase();
                const participantJid = m.jid;
                const participantId = tools.general.getID(participantJid);

                if (game.answers.has(userAnswer)) {
                    game.answers.delete(userAnswer);
                    game.participants.add(participantId);

                    const earnedCoin = tools.general.calculateTimeBasedCoin(game.startTime, Date.now());
                    const validCoin = Number.isFinite(earnedCoin) ? Math.max(0, Math.floor(earnedCoin)) : 20;
                    await Database.addGameReward(participantId, validCoin);
                    
                    await ctx.sendMessage(ctx.id, {
                        text: `${quote(`✅ ${tools.general.ucword(userAnswer)} benar! (+${validCoin} Koin)`)}\n` +
                              quote(`Jawaban tersisa: ${game.answers.size}`)
                    }, {
                        quoted: m
                    });

                    if (game.answers.size === 0) {
                        session.delete(ctx.id);
                        for (const participant of game.participants) {
                            await Database.addGameReward(participant, game.allAnsweredBonus);
                        }
                        await ctx.reply(quote(`🎉 Selamat! Semua jawaban telah terjawab! Setiap anggota yang menjawab mendapat bonus ${game.allAnsweredBonus} koin.`));
                        return collector.stop();
                    }
                } else if (userAnswer === "s") {
                    const answer = [...game.answers].map(tools.general.ucword).join(", ").replace(/, ([^,]*)$/, ", dan $1");
                    session.delete(ctx.id);
                    await ctx.reply(
                        `${quote("🏳️ Anda menyerah!")}\n` +
                        quote(`Jawabannya adalah ${answer}.`)
                    );
                    return collector.stop();
                }
            });

            collector.on("end", async () => {
                if (session.has(ctx.id)) {
                    const answer = [...game.answers].map(tools.general.ucword).join(", ").replace(/, ([^,]*)$/, ", dan $1");
                    session.delete(ctx.id);
                    return await ctx.reply(
                        `${quote("⏱ Waktu habis!")}\n` +
                        quote(`Jawaban yang belum terjawab: ${answer}.`)
                    );
                }
            });
        } catch (error) {
            if (session.has(ctx.id)) {
                session.delete(ctx.id);
            }
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};