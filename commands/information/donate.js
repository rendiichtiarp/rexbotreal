const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');
const { version } = require('../../package.json');

module.exports = {
    name: "donate",
    aliases: ["donasi"],
    category: "information",
    permissions: {},
    code: async (ctx) => {
        try {
            const senderJid = ctx.sender.jid;
            const senderId = tools.general.getID(senderJid);

            const settings = await Database.getBotSettings();
            const caption = settings?.donate ? 
                settings.donate
                    .replace(/%tag%/g, `@${senderId}`)
                    .replace(/%name%/g, config.bot.name)
                    .replace(/%version%/g, version)
                    .replace(/%prefix%/g, ctx.used.prefix)
                    .replace(/%command%/g, ctx.used.command)
                    .replace(/%watermark%/g, config.msg.watermark)
                    .replace(/%footer%/g, config.msg.footer)
                    .replace(/%readmore%/g, config.msg.readmore) :
                `*DONASI ${config.bot.name}*\n\n` +
                `✊ Dukung bot ini agar tetap aktif\n\n` +
                `📱 E-WALLET\n` +
                `• DANA: 081284900651\n` +
                `• GOPAY: 081284900651\n` +
                `• QRIS: Scan QR di atas\n\n` +
                `🌐 PLATFORM\n` +
                `• https://saweria.co/rexbotreal\n\n` +
                `Terima kasih atas dukungannya! 🙏\n` +
                "\n" +
                config.msg.footer;

            return await ctx.reply({
                image: {
                    url: "https://raw.githubusercontent.com/rendiichtiarp/RexbotX/refs/heads/main/qris.png"
                },
                caption: caption,
                mentions: [senderJid]
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};