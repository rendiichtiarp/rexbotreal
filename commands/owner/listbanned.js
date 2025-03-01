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

            let resultText = "";
            let userMentions = [];

            bannedUsers.forEach((user) => {
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
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};