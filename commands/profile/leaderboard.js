const {
    quote
} = require("@mengkodingan/ckptw");


module.exports = {
    name: "leaderboard",
    aliases: ["lb"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        try {
            const senderId = tools.general.getID(ctx.sender.jid);
            const users = await Database.getAllUsers();

            const leaderboardData = users
                .map(user => ({
                    id: user.id,
                    level: user.level || 0,
                    win_game: user.win_game || 0
                }))
                .sort((a, b) => b.win_game - a.win_game || b.level - a.level);

            const userRank = leaderboardData.findIndex(user => user.id === senderId) + 1;
            const topUsers = leaderboardData.slice(0, 10);
            const userMentions = [];
            let resultText = "";

            topUsers.forEach((user, index) => {
                resultText += quote(`${index + 1}. @${user.id} - Menang: ${user.win_game}, Level: ${user.level}\n`);
                userMentions.push(`${user.id}@s.whatsapp.net`);
            });

            if (userRank > 10) {
                const userStats = leaderboardData[userRank - 1];
                resultText += quote(`${userRank}. @${senderId} - Menang: ${userStats.win_game}, Level: ${userStats.level}\n`);
                userMentions.push(`${senderId}@s.whatsapp.net`);
            }

            return await ctx.reply({
                text: `${resultText.trim()}\n` +
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