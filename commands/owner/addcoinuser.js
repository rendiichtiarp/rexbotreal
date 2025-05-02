const {
    quote
} = require("@mengkodingan/ckptw");


module.exports = {
    name: "addcoinuser",
    aliases: ["addcoin", "acu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const userId = ctx.args[0];
        const coinAmount = parseInt(ctx.args[!!ctx.quoted?.senderJid ? 0 : 1], 10);
        
        // Validasi input coin
        if (!coinAmount || isNaN(coinAmount)) {
            return await ctx.reply(quote("❎ Jumlah coin tidak valid!"));
        }

        const userJid = ctx.quoted.senderJid || mentionedJid || (userId ? `${userId}@s.whatsapp.net` : null);
        
        if (!userJid) {
            return await ctx.reply({
                text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                    quote(tools.cmd.generateCommandExample(ctx.used, `@user 100`)),
                mentions: [ctx.sender.jid]
            });
        }

        
        const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
         if (!isOnWhatsApp.exists) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));

             try {
            // Bersihkan ID dari karakter khusus
            const targetId = tools.general.getID(userJid).replace(/[^\d]/g, '');
            const userDb = await Database.getUser(targetId);
            
            // Pastikan nilai coin selalu valid
            const currentCoin = userDb?.coin || 0;
            const newCoin = currentCoin + coinAmount;

            await Database.updateUser(targetId, {
                coin: newCoin
            });

            await ctx.sendMessage(userJid, {
                text: quote(`🎉 Anda telah menerima ${coinAmount} coin dari Owner!`)
            });
            
            return await ctx.reply(quote(`✅ Berhasil menambahkan ${coinAmount} coin kepada pengguna!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};