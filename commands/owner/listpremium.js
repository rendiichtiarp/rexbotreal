const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "listpremium",
    aliases: ["listprem"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            const users = await Database.getAllUsers();
            const premiumUsers = users.filter(user => user.premium === 1 || user.premium === true);

            if (premiumUsers.length === 0) {
                return await ctx.reply(quote("❎ Tidak ada pengguna yang premium."));
            }

            let resultText = quote(`📋 Daftar Pengguna Premium\n`) +
                quote(`Total: ${premiumUsers.length} pengguna\n`) +
                quote(`──────────────\n`);
            let userMentions = [];

            premiumUsers.forEach((user) => {
                const expiredTime = user.premium_expired ? new Date(user.premium_expired).toLocaleString('id-ID') : "Permanen";
                const remainingTime = user.premium_expired ? tools.general.convertMsToDuration(user.premium_expired - Date.now()) : "Permanen";
                
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