const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
    name: "transfer",
    aliases: ["tf"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const userId = ctx.args[0];
        const coinAmount = parseInt(ctx.args[1], 10);

        const userJid = ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (userId ? `${userId}@s.whatsapp.net` : null) || ctx.quoted.senderJid;
        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid).replace(/[^\d]/g, '');

        if ((!userJid || !coinAmount) || isNaN(coinAmount)) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId} 8`)),
            mentions: [senderJid]
        });

        try {
            const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
            if (!isOnWhatsApp || !isOnWhatsApp.exists) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));

            if (senderId === userId) return await ctx.reply(quote(`❎ Anda tidak dapat mentransfer koin ke diri sendiri!`));

            const senderData = await Database.getUser(senderId);
            if (!senderData || senderData.coin < coinAmount) return await ctx.reply(quote(`❎ Koin Anda tidak mencukupi untuk transfer ini!`));

            const receiverId = tools.general.getID(userJid).replace(/[^\d]/g, '');
            
            // Update koin pengirim
            await Database.updateUser(senderId, {
                coin: senderData.coin - coinAmount
            });

            // Update koin penerima
            const receiverData = await Database.getUser(receiverId);
            const receiverCoin = receiverData?.coin || 0;
            await Database.updateUser(receiverId, {
                coin: receiverCoin + coinAmount
            });

            return await ctx.reply(quote(`✅ Berhasil mentransfer ${coinAmount} koin ke pengguna!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};