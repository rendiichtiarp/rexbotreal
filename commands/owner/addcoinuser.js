const {
    quote
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');

module.exports = {
    name: "addcoinuser",
    aliases: ["addcoin", "acu"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const userId = ctx.args[0];
        const coinAmount = parseInt(ctx.args[1], 10);

        const senderJid = ctx.sender.jid;
        const senderId = senderJid.split(/[:@]/)[0];
        const mentionedJids = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const targetUser = Array.isArray(mentionedJids) && mentionedJids.length > 0 ? 
            mentionedJids[0].split('@')[0] : userId?.replace(/[^0-9]/g, '');

        if (!targetUser || isNaN(coinAmount)) return await ctx.reply({
            text: `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used, `@${senderId} 4`)),
            mentions: [senderJid]
        });

        try {
            // Cek apakah user ada di database
            const userData = await userHelper.getUser(targetUser);
            if (!userData?.no_user) {
                return await ctx.reply(quote(`❎ User belum terdaftar di database!`));
            }

            // Add coin using helper
            await userHelper.addCoin(targetUser, coinAmount);

            // Kirim notifikasi ke user
            await ctx.sendMessage(`${targetUser}@s.whatsapp.net`, {
                text: quote(`🎉 Kamu telah menerima ${coinAmount} koin dari Owner!`)
            });

            return await ctx.reply(quote(`✅ Berhasil menambahkan ${coinAmount} koin kepada pengguna!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};