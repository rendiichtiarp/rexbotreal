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

            let resultText = "";
            let userMentions = [];

            premiumUsers.forEach((user) => {
                resultText += `${quote(`@${user.id}`)}\n`;
                userMentions.push(`${user.id}@s.whatsapp.net`);
            });

            return await ctx.reply({
                text: `${resultText}` +
                    "\n" +
                    config.msg.footer,
                mentions: userMentions
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};