const {
    quote,
    monospace,
    bold
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "leaderboard",
    aliases: ["lb"],
    category: "profile",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const senderJid = ctx.sender.jid.split(/[:@]/)[0];
            const users = (await db.toJSON()).user;

            const leaderboardData = Object.entries(users)
                .map(([id, data]) => ({
                    id,
                    level: data.level || 0,
                    winGame: data.winGame || 0
                }))
                .sort((a, b) => b.winGame - a.winGame || b.level - a.level);

            const userRank = leaderboardData.findIndex(user => user.id === senderJid) + 1;
            const topUsers = leaderboardData.slice(0, 10);
            const userMentions = [];
            let resultText = "";

            topUsers.forEach((user, index) => {
                resultText += (`${index + 1}. @${user.id}\n Menang: ${user.winGame}, Level: ${user.level}\n`);
                userMentions.push(`${user.id}@s.whatsapp.net`);
            });

            if (userRank > 10) {
                const userStats = leaderboardData[userRank - 1];
                resultText += (`${userRank}. @${senderJid}\n Menang: ${userStats.winGame}, Level: ${userStats.level}\n`);
                userMentions.push(`${senderJid}@s.whatsapp.net`);
            }

            return await ctx.reply({
                text: `${bold(`LEADERBOARD TOP RANKING 10`)}\n\n` +
                    `${resultText.trim()}\n` +
                    "\n" +
                    config.msg.footer,
                mentions: userMentions
            });
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};