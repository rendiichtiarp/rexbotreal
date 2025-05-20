const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "banuser",
    aliases: ["ban", "bu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const userId = ctx.args[0];
        const duration = ctx.args[1]; // Bisa berupa angka atau "permanent"/"permanen"

        const userJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (userId ? `${userId}@s.whatsapp.net` : null);
        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);

        if (!userJid || !duration) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId} 30`))}\n` +
                `${quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId} permanent`))}\n` +
                quote(tools.cmd.generateNotes(["Balas atau kutip pesan untuk menjadikan pengirim sebagai target akun."])),
            mentions: [senderJid]
        });
        
        const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
         if (!isOnWhatsApp.exists) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));

             try {
            // Cek apakah permanen atau durasi
            const isPermanent = duration.toLowerCase() === "permanent" || duration.toLowerCase() === "permanen";
            const durationNumber = isPermanent ? null : parseInt(duration);

            if (!isPermanent && (isNaN(durationNumber) || durationNumber <= 0)) {
                return await ctx.reply(quote("❎ Durasi harus berupa angka positif atau 'permanent'/'permanen'!"));
            }

            // Hitung waktu expired jika tidak permanen
            const expiredTime = isPermanent ? null : Date.now() + (durationNumber * 24 * 60 * 60 * 1000);

            await Database.updateUser(tools.general.getID(userJid), {
                banned: true,
                banned_expired: expiredTime
            });

            const durationText = isPermanent ? "Permanent" : `${durationNumber} hari`;
            const expiredText = isPermanent ? "Permanent" : new Date(expiredTime).toLocaleString('id-ID');

            await ctx.sendMessage(userJid, {
                text: quote(`💡 Anda telah dibanned oleh Owner!\n`) +
                    quote(`Durasi: ${durationText}\n`) +
                    quote(`Berakhir pada: ${expiredText}`)
            });
            
            return await ctx.reply(quote(`✅ Berhasil dibanned!\n`) +
                quote(`User: @${tools.general.getID(userJid)}\n`) +
                quote(`Durasi: ${durationText}\n`) +
                quote(`Berakhir pada: ${expiredText}`), {
                mentions: [userJid]
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};