const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "donate",
    aliases: ["donasi"],
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

         try {
            const senderJid = ctx.sender.jid;
            const senderId = senderJid.split(/[:@]/)[0];
            const customText = await db.get(`bot.text.donate`) || null;
            const text = customText ?
                customText
                .replace(/%tag%/g, `@${senderId}`)
                .replace(/%name%/g, config.bot.name)
                .replace(/%version%/g, config.pkg.version)
                .replace(/%prefix%/g, ctx._used.prefix)
                .replace(/%command%/g, ctx._used.command)
                .replace(/%watermark%/g, config.msg.watermark)
                .replace(/%watermark%/g, config.msg.watermark)
                .replace(/%footer%/g, config.msg.footer)
                .replace(/%readmore%/g, config.msg.readmore) :
                `${monospace("💸 Donasi melalui pembayaran dibawah ini:")}\n\n` +
            `${monospace("📱 QRIS:\nhttps://i.imgur.com/FelT7zk.png")}\n\n` +
            `${monospace("💳 DANA/GOPAY:\n081284900651")}\n\n` +
            `${monospace("Setelah melakukan pembayaran harap hubungi owner dengan mengirimkan bukti pembayaran.")}\n`
                "\n" +
                config.msg.footer;
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