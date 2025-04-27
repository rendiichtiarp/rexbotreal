const {
    quote
} = require("@mengkodingan/ckptw");
const didYouMean = require("didyoumean");

const session = new Map();

function generateMathQuestion() {
    const operations = ['+', '-', '*', '/'];
    const num1 = Math.floor(Math.random() * 50) + 1;
    const num2 = Math.floor(Math.random() * 50) + 1;
    const num3 = Math.floor(Math.random() * 50) + 1;

    const questionFormat = `${num1} ${operations[Math.floor(Math.random() * operations.length)]} ${num2} ${operations[Math.floor(Math.random() * operations.length)]} ${num3}`;
    let correctAnswer = eval(questionFormat);

    if (!Number.isInteger(correctAnswer)) {
        return generateMathQuestion();
    }

    return { question: questionFormat, answer: correctAnswer };
}

module.exports = {
    name: "mtkdasar",
    category: "game",
    permissions: {},
    code: async (ctx) => {
        if (session.has(ctx.id)) return await ctx.reply(quote(`🎮 Sesi permainan sedang berjalan!`));

        try {
            const result = generateMathQuestion();
            
            const game = {
                startTime: Date.now(),
                timeout: 60000,
                senderId: tools.general.getID(ctx.sender.jid),
                answer: result.answer
            };

            session.set(ctx.id, true);

            await ctx.reply(
                `${quote(`Soal:  ${result.question}`)}\n` +
                `${quote(`Bonus: 20 Koin (Akan berkurang berdasarkan waktu)`)}\n` +
                `${quote(`Batas waktu: ${tools.general.convertMsToDuration(game.timeout)}`)}\n` +
                `${quote("Ketik 's' untuk menyerah.")}\n` +
                "\n" +
                config.msg.footer
            );

            const collector = ctx.MessageCollector({
                time: game.timeout
            });

            collector.on("collect", async (m) => {
                const userAnswer = parseFloat(m.content);

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
                } else if (m.content.toLowerCase() === "s") {
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
                        quote(`Jawabannya adalah ${game.answer}.`)
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
