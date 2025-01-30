const {
    quote
} = require("@mengkodingan/ckptw");
const botHelper = require('../../database/bot');

module.exports = {
    name: "price",
    aliases: ["belibot", "rent", "rentbot", "sewa", "sewabot"],
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const senderJid = ctx.sender.jid;
            const senderId = senderJid.split(/[:@]/)[0];

            const customText = await botHelper.getSetting('text_price') || null;
            const text = customText ?
                customText
                .replace(/%tag%/g, `@${senderId}`)
                .replace(/%name%/g, config.bot.name)
                .replace(/%version%/g, config.pkg.version)
                .replace(/%prefix%/g, ctx._used.prefix)
                .replace(/%command%/g, ctx._used.command)
                .replace(/%watermark%/g, config.msg.watermark)
                .replace(/%footer%/g, config.msg.footer)
                .replace(/%readmore%/g, config.msg.readmore) :
                quote("❎ Bot ini tidak memiliki harga.");

            return await ctx.reply({
                text: text,
                mentions: [senderJid]
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};