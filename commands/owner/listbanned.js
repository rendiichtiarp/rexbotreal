const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "listbanned",
    aliases: ["listban"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            // Ambil semua user yang dibanned
            const users = await Database.getAllUsers();
            const bannedUsers = users.filter(user => user.banned === 1 || user.banned === true);

            if (bannedUsers.length === 0) {
                return await ctx.reply(quote("❎ Tidak ada pengguna yang dibanned."));
            }

            let resultText = quote(`📋 Daftar Pengguna Banned\n`) +
                quote(`Total: ${bannedUsers.length} pengguna\n`) +
                quote(`──────────────\n`);
            let userMentions = [];

            bannedUsers.forEach((user) => {
                const expiredTime = user.banned_expired ? new Date(user.banned_expired).toLocaleString('id-ID') : "Permanen";
                const remainingTime = user.banned_expired ? tools.general.convertMsToDuration(user.banned_expired - Date.now()) : "Permanen";
                
                resultText += quote(`👤 @${user.id}\n`) +
                    quote(`Berakhir: ${expiredTime}\n`) +
                    quote(`Sisa waktu: ${remainingTime}\n`) +
                    quote(`──────────────\n`);
                userMentions.push(`${user.id}@s.whatsapp.net`);
            });

            return await ctx.reply({
                text: resultText + config.msg.footer,
                mentions: userMentions
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};