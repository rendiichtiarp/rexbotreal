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
        const mentionedJid = ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const userId = ctx.args[0];
        const userJid = mentionedJid || (userId ? `${userId}@s.whatsapp.net` : null) || ctx.quoted.senderJid;
         const senderId = tools.general.getID(ctx.sender.jid);
         const coinAmount = parseInt(ctx.args[mentionedJid ? 1 : 0], 10);

        if ((!userJid || !coinAmount) || isNaN(coinAmount)) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId} 8`)),
            mentions: [senderJid]
        });

        
            const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
            if (isOnWhatsApp.length < 0) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));

         try {
            if (senderId === userId) return await ctx.reply(quote(`❎ Anda tidak dapat mentransfer koin ke diri sendiri!`));

            const senderData = await Database.getUser(senderId);
            if (!senderData || senderData.coin < coinAmount) return await ctx.reply(quote(`❎ Koin Anda tidak mencukupi untuk transfer ini!`));

            const receiverId = tools.general.getID(userJid);
            
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

            // Kirim notifikasi ke penerima
            await ctx.core.sendMessage(userJid, {
                text: quote(`💰 Anda menerima transfer ${coinAmount} koin dari @${senderId}!`),
                mentions: [senderJid]
            });

            return await ctx.reply(quote(`✅ Berhasil mentransfer ${coinAmount} koin ke pengguna!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};