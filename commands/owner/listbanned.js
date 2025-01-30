const {
    quote
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');

module.exports = {
    name: "listbanned",
    aliases: ["listban"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const bannedUsers = await userHelper.getBannedUsers();

            if (bannedUsers.length === 0) {
                return await ctx.reply(quote(`❎ Tidak ada pengguna yang dibanned.`));
            }

            let resultText = "";
            let userMentions = [];

            bannedUsers.forEach((userId) => {
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