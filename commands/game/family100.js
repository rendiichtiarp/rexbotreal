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
                coin: {
                    answered: 20,
                    allAnswered: 100
                },
                timeout: 90000,
                senderId: tools.general.getID(ctx.sender.jid),
                answers: new Set(result.jawaban.map(d => d.toLowerCase())),
                participants: new Set()
            };

            session.set(ctx.id, true);

            await ctx.reply(
                `${quote(`Soal: ${result.soal}`)}\n` +
                `${quote(`Jumlah jawaban: ${game.answers.size}`)}\n` +
                `${quote(`Batas waktu ${tools.general.convertMsToDuration(game.timeout)}`)}\n` +
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

                    await Database.addGameReward(participantId, game.coin.answered);
                    await ctx.sendMessage(ctx.id, {
                        text: quote(`✅ ${tools.general.ucword(userAnswer)} benar! Jawaban tersisa: ${game.answers.size}`)
                    }, {
                        quoted: m
                    });

                    if (game.answers.size === 0) {
                        session.delete(ctx.id);
                        for (const participant of game.participants) {
                            await Database.addGameReward(participant, game.coin.allAnswered);
                        }
                        await ctx.reply(quote(`🎉 Selamat! Semua jawaban telah terjawab! Setiap anggota yang menjawab mendapat ${game.coin.allAnswered} koin.`));
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
                const remaining = [...game.answers].map(tools.general.ucword).join(", ").replace(/, ([^,]*)$/, ", dan $1");

                if (session.has(ctx.id)) {
                    session.delete(ctx.id);
                    return await ctx.reply(
                        `${quote("⏱ Waktu habis!")}\n` +
                        quote(`Jawaban yang belum terjawab adalah: ${remaining}`)
                    );
                }
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};