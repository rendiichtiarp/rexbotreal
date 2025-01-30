const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const userHelper = require('../../database/users');

module.exports = {
    name: "iqtest",
    category: "entertainment",
    handler: {
        coin: 10
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const senderId = ctx.sender.jid.split(/[:@]/)[0];
        const userDb = await userHelper.getUser(senderId);

        let iqScore;
        let feedback;

        if (userDb.wingame < 5) {
            iqScore = Math.floor(Math.random() * 50) + 1;
            feedback = iqScore < 50 ?
                "Hmm, mungkin Kamu harus mencobanya lagi? Jangan menyerah!" :
                "Cukup bagus, terus bermain untuk meningkatkan keterampilan Kamu!";
        } else if (userDb.wingame < 20) {
            iqScore = Math.floor(Math.random() * 50) + 51;
            feedback = iqScore < 100 ?
                "Tidak buruk, tapi Kamu bisa melakukannya lebih baik!" :
                "Kamu semakin pintar! Pertahankan momentum!";
        } else {
            iqScore = Math.floor(Math.random() * 50) + 101;
            feedback = iqScore < 150 ?
                "Luar biasa! Kamu di atas rata-rata!" :
                "Wah, kamu jenius luar biasa! Kemenanganmu sangat mengesankan!";
        }

        return await ctx.reply(quote(`🧠 IQ Kamu sebesar: ${iqScore}. ${feedback}`));
    }
};