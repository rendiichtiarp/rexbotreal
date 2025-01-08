const { monospace, quote } = require("@mengkodingan/ckptw");
const axios = require("axios");

const session = new Map();

function generateMathQuestion() {
    const operations = ['+', '-', '*', '/'];
    const num1 = Math.floor(Math.random() * 50) + 1; // Angka 1-50
    const num2 = Math.floor(Math.random() * 50) + 1; // Angka 1-50
    const num3 = Math.floor(Math.random() * 50) + 1; // Angka 1-50

    // Membuat soal dengan format yang lebih bervariasi
    const questionFormat = `${num1} ${operations[Math.floor(Math.random() * operations.length)]} ${num2} ${operations[Math.floor(Math.random() * operations.length)]} ${num3}`;

    // Menghitung jawaban
    let correctAnswer = eval(questionFormat);

    // Pastikan jawaban adalah bilangan bulat
    if (!Number.isInteger(correctAnswer)) {
        return generateMathQuestion(); // Generate ulang jika tidak memenuhi syarat
    }

    return { question: questionFormat, correctAnswer };
}

module.exports = {
    name: "mtkdasar",
    category: "game",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        if (session.has(ctx.id))
            return await ctx.reply(quote(`🎯 Sesi permainan ini sedang berlangsung! Tunggu hingga selesai.`));

        const game = generateMathQuestion();
        const timeout = 90000; // 90 detik
        session.set(ctx.id, true);

        await ctx.reply(
            `${quote(`Soal: ${game.question}`)}\n` +
            `${quote(`Waktu: ${timeout / 1000} detik`)}\n` +
            `${quote("Ketik 's' untuk menyerah.")}\n` +
            "\n" +
            config.msg.footer
        );

        const collector = ctx.MessageCollector({
            time: timeout,
        });

        collector.on("collect", async (m) => {
            const userAnswer = parseFloat(m.content);

            if (userAnswer === game.correctAnswer) {
                session.delete(ctx.id);
                const updatedUserDb = await db.get(`user.${ctx.sender.jid.split(/[:@]/)[0]}`) || {};
                
                await Promise.all([
                    db.set(`user.${ctx.sender.jid.split(/[:@]/)[0]}.coin`, (updatedUserDb?.coin || 0) + 5),
                    await db.add(`user.${ctx.sender.jid.split(/[:@]/)[0]}.winGame`, 1),
                ]);
                await ctx.sendMessage(
                    ctx.id,
                    {
                        text: `${quote("💯 Kamu benar!")}\n` + quote(`+5 Koin`),
                    },
                    {
                        quoted: m,
                    }
                );
                return collector.stop();
            } else if (m.content.toLowerCase() === "s") {
                session.delete(ctx.id);
                await ctx.reply(
                    `${quote("💭 Kamu menyerah!")}\n` +
                    quote(`Jawaban: ${game.correctAnswer}.`)
                );
                return collector.stop();
            }
        });

        collector.on("end", async () => {
            if (session.has(ctx.id)) {
                session.delete(ctx.id);
                return await ctx.reply(
                    `${quote("⏰ Waktu kamu habis!")}\n` +
                    quote(`Jawaban: ${game.correctAnswer}.`)
                );
            }
        });
    },
};
