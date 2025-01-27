const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "givecoin",
    aliases: ["gc", "gcoin"],
    category: "profile",
    handler: {},
    
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const userId = ctx.args[0];
        const coinAmount = parseInt(ctx.args[1], 10);

        const senderJid = ctx.sender.jid;
        const senderId = senderJid.split(/[:@]/)[0];
        const mentionedJids = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const user = Array.isArray(mentionedJids) && mentionedJids.length > 0 ? mentionedJids[0] : (userId ? `${userId}@s.whatsapp.net` : null);

        const senderCoins = await db.get(`user.${senderId}.coin`) || 0;

        const userMentions = user ? [`${user.split("@")[0]}@s.whatsapp.net`] : [];

        if (!user && isNaN(coinAmount)) return await ctx.reply({
            text: `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used, `@${senderId} 4`)),
            mentions: [senderJid]
        });

        if (isNaN(coinAmount) || coinAmount <= 0) return await ctx.reply({
            text: quote(`❎ Anda tidak dapat mengirim koin dengan jumlah 0 koin kepada @${user.split(/[:@]/)[0]}!`),
            mentions: userMentions
        });

        if (senderCoins < coinAmount) return await ctx.reply({
            text: quote(`❎ Koin Anda tidak cukup untuk memberikan ${coinAmount} koin kepada @${user.split(/[:@]/)[0]}!`),
            mentions: userMentions
        });

        try {
            const [result] = await ctx._client.onWhatsApp(user);
            if (!result.exists) return await ctx.reply(quote(`❎ Akun tidak ada di WhatsApp!`));

            await db.add(`user.${user.split("@")[0]}.coin`, coinAmount);
            await db.subtract(`user.${senderId}.coin`, coinAmount);

            await ctx.sendMessage(user, {
                text: quote(`🎉 Kamu telah menerima ${coinAmount} koin dari @${senderId}!`),
                mentions: [user]
            });
            return await ctx.reply({
                text: quote(`✅ Berhasil memberikan ${coinAmount} koin kepada pengguna @${user.split(/[:@]/)[0]}!`),
                mentions: userMentions
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};