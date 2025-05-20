const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "delpremuser",
    aliases: ["delprem", "dpu"],
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
                quote(tools.cmd.generateNotes(["Balas atau quote pesan untuk menjadikan pengirim sebagai target akun."])),
            mentions: [senderJid]
        });

        
        const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
        if (!isOnWhatsApp.exists) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));
            
        try {
            await Database.updateUser(tools.general.getID(userJid), {
                premium: false,
                premium_expired: null
            });

            await ctx.sendMessage(userJid, {
                text: quote(`💡 Status premium Anda telah dihapus oleh Owner!\n`) +
                    quote(`Terima kasih telah berlangganan premium.`)
            });
            
            return await ctx.reply(quote(`✅ Berhasil dihapus sebagai pengguna Premium!\n`) +
                quote(`User: @${tools.general.getID(userJid)}`), {
                mentions: [userJid]
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};