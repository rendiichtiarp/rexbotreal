const {
    quote
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');

module.exports = {
    name: "afk",
    category: "profile",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;
        const senderId = ctx.sender.jid.split(/[:@]/)[0];

        try {
            await userHelper.setAFK(senderId, true, input);
            return await ctx.reply(quote(`💤 Anda akan AFK, ${input ? `dengan alasan "${input}"` : "tanpa alasan"}.`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};