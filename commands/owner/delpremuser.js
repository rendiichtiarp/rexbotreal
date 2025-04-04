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

        const userJid = ctx.quoted?.senderJid || ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (userId ? `${userId}@s.whatsapp.net` : null);
        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);

        if (!userJid) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId}`)),
            mentions: [senderJid]
        });

        try {
            const [result] = await ctx.core.onWhatsApp(userJid);
            if (!result.exists) return await ctx.reply(quote(`❎ Akun tidak ada di WhatsApp!`));
            
            await Database.updateUser(tools.general.getID(userJid), {
                premium: false
            });

            await ctx.sendMessage(userJid, {
                text: quote(`🎉 Anda telah dihapus sebagai pengguna Premium oleh Owner!`)
            });
            return await ctx.reply(quote(`✅ Berhasil dihapus sebagai pengguna Premium!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};