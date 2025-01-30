const {
    quote
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');

module.exports = {
    name: "listpremium",
    aliases: ["listprem"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const premiumUsers = await userHelper.getPremiumUsers();

            if (premiumUsers.length === 0) {
                return await ctx.reply(quote(`❎ Tidak ada pengguna premium.`));
            }

            let resultText = "";
            let userMentions = [];

            premiumUsers.forEach((userId) => {
                resultText += `${quote(`@${userId}`)}\n`;
                userMentions.push(`${userId}@s.whatsapp.net`);
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