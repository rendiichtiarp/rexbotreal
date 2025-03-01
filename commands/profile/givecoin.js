const { 
    quote 
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "givecoin",
    aliases: ["gc", "gcoin"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);
        const userDb = await Database.getUser(senderId);

        // Cek apakah ada yang di mention
        const mentionedJid = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const targetId = mentionedJid?.[0] ? tools.general.getID(mentionedJid[0]) : ctx.args[0];
        const amount = parseInt(ctx.args[mentionedJid?.[0] ? 1 : 1]);

        if (!targetId || isNaN(amount)) {
            return await ctx.reply(
                `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.msg.generateCommandExample(ctx.used, "@user 1000"))}\n` +
                quote(`Note: Tag pengguna atau masukkan nomor pengguna`)
            );
        }

        // Cek jumlah coin yang akan dikirim
        if (amount <= 0) {
            return await ctx.reply(quote(
                `❎ Minimal transfer 1 coin!`
            ));
        }

        // Cek coin pengirim
        if ((userDb?.coin || 0) < amount) {
            return await ctx.reply(quote(
                `❎ Coin kamu tidak cukup untuk transfer ${amount} coin!\n` +
                `Coin kamu saat ini: ${userDb?.coin || 0}`
            ));
        }

        try {
            // Cek apakah nomor valid di WhatsApp
            const [result] = await ctx.core.onWhatsApp(`${targetId}@s.whatsapp.net`);
            if (!result?.exists) {
                return await ctx.reply(quote(`❎ Nomor tersebut tidak terdaftar di WhatsApp!`));
            }

            // Transfer coin
            const targetDb = await Database.getUser(targetId);
            await Database.updateUser(targetId, {
                coin: (targetDb?.coin || 0) + amount
            });
            await Database.updateUser(senderId, {
                coin: (userDb?.coin || 0) - amount
            });

            // Kirim notifikasi ke penerima
            await ctx.sendMessage(`${targetId}@s.whatsapp.net`, {
                text: quote(`🎉 Kamu menerima ${amount} coin dari @${senderId}!`),
                mentions: [`${senderId}@s.whatsapp.net`]
            });

            // Kirim konfirmasi ke pengirim
            return await ctx.reply({
                text: quote(`✅ Berhasil mengirim ${amount} coin ke @${targetId}!`),
                mentions: [`${targetId}@s.whatsapp.net`]
            });

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
