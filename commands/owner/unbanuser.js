const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "unbanuser",
    aliases: ["unban", "ubu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const userId = ctx.args[0];

        const userJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (userId ? `${userId}@s.whatsapp.net` : null);
        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);

        if (!userJid) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId}`))}\n` +
                quote(tools.cmd.generateNotes(["Balas atau kutip pesan untuk menjadikan pengirim sebagai target akun."])),
            mentions: [senderJid]
        });

        const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
             if (!isOnWhatsApp.exists) return await ctx.reply(quote(`❎ Akun tidak ada di WhatsApp!`));

        // Cek apakah user dibanned
        const userDb = await Database.getUser(tools.general.getID(userJid));
        if (!userDb?.banned) return await ctx.reply(quote("❎ User tidak dalam status banned!"));

             try {
            await Database.updateUser(tools.general.getID(userJid), {
                banned: false,
                banned_expired: null
            });

            await ctx.sendMessage(userJid, {
                text: quote(`💡 Anda telah diunbanned oleh Owner!\n`) +
                    quote(`Terima kasih telah mematuhi peraturan.`)
            });

            return await ctx.reply(quote(`✅ Berhasil diunbanned!\n`) +
                quote(`User: @${tools.general.getID(userJid)}`), {
                mentions: [userJid]
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};