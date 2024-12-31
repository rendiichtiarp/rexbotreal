const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "about",
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        return await ctx.reply(
            quote(`👋 Halo! Aku adalah Bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${config.owner.name}. Aku bisa apa aja, kaya bikin stiker, pakai ai buat kerjain sesuatu, dan banyak perintah lainnya. Ketik ${ctx._used.prefix}menu untuk melihat apa aja yang bisa aku lakukan`)
        ); // Dapat diubah sesuai keinginan Anda
    }
};