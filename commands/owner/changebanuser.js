const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "changebanuser",
    aliases: ["changeban", "cbu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const userId = ctx.args[0];
        const duration = parseInt(ctx.args[1]); // Durasi dalam hari

        const userJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (userId ? `${userId}@s.whatsapp.net` : null);
        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);

        if (!userJid || !duration || isNaN(duration)) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId} 30`)) + "\n" +
                quote(tools.cmd.generateNotes(["Balas atau kutip pesan untuk menjadikan pengirim sebagai target akun."])),
            mentions: [senderJid]
        });

        const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
        if (!isOnWhatsApp.exists) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp."));

        // Cek apakah user dibanned
        const userDb = await Database.getUser(tools.general.getID(userJid));
        if (!userDb?.banned) return await ctx.reply(quote("❎ User tidak dalam status banned!"));

        try {
            // Hitung waktu expired baru (timestamp dalam milidetik)
            const expiredTime = Date.now() + (duration * 24 * 60 * 60 * 1000);

            await Database.updateUser(tools.general.getID(userJid), {
                banned_expired: expiredTime
            });

            await ctx.sendMessage(userJid, {
                text: quote(`💡 Durasi banned Anda telah diubah oleh Owner!\n`) +
                    quote(`Durasi baru: ${duration} hari\n`) +
                    quote(`Berakhir pada: ${new Date(expiredTime).toLocaleString('id-ID')}`)
            });
            
            return await ctx.reply(quote(`✅ Berhasil mengubah durasi banned!\n`) +
                quote(`User: @${tools.general.getID(userJid)}\n`) +
                quote(`Durasi baru: ${duration} hari\n`) +
                quote(`Berakhir pada: ${new Date(expiredTime).toLocaleString('id-ID')}`), {
                mentions: [userJid]
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
