const { 
    quote 
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "givelimit",
    aliases: ["gl", "glimit"],
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

        // Cek jumlah limit yang akan dikirim
        if (amount <= 0) {
            return await ctx.reply(quote(
                `❎ Minimal transfer 1 limit!`
            ));
        }

        // Cek limit pengirim
        if ((userDb?.user_limit || 0) < amount) {
            return await ctx.reply(quote(
                `❎ limit kamu tidak cukup untuk transfer ${amount} limit!\n` +
                `limit kamu saat ini: ${userDb?.user_limit || 0}`
            ));
        }

        try {
            // Cek apakah nomor valid di WhatsApp
            const [result] = await ctx.core.onWhatsApp(`${targetId}@s.whatsapp.net`);
            if (!result?.exists) {
                return await ctx.reply(quote(`❎ Nomor tersebut tidak terdaftar di WhatsApp!`));
            }

            // Transfer limit
            const targetDb = await Database.getUser(targetId);
            await Database.updateUser(targetId, {
                user_limit: (targetDb?.user_limit || 0) + amount
            });
            await Database.updateUser(senderId, {
                user_limit: (userDb?.user_limit || 0) - amount
            });

            // Kirim notifikasi ke penerima
            await ctx.sendMessage(`${targetId}@s.whatsapp.net`, {
                text: quote(`🎉 Kamu menerima ${amount} limit dari @${senderId}!`),
                mentions: [`${senderId}@s.whatsapp.net`]
            });

            // Kirim konfirmasi ke pengirim
            return await ctx.reply({
                text: quote(`✅ Berhasil mengirim ${amount} limit ke @${targetId}!`),
                mentions: [`${targetId}@s.whatsapp.net`]
            });

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};
