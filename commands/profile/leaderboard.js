const {
    quote,
    monospace,
    bold
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');

module.exports = {
    name: "leaderboard",
    aliases: ["lb"],
    category: "profile",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const senderJid = ctx.sender.jid.split(/[:@]/)[0];
            
            // Get leaderboard data
            const leaderboardData = await userHelper.getLeaderboard();
            const userRank = await userHelper.getUserRank(senderJid);
            
            // Get top 10 users
            const topUsers = leaderboardData.slice(0, 10);
            const userMentions = [];
            let resultText = "";

            // Generate leaderboard text
            topUsers.forEach((user, index) => {
                const isUser = user.id === senderJid;
                const position = index + 1;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                const userName = user.name || user.id;
                const userText = `${medal}${position}. @${user.id}${isUser ? ' (Anda)' : ''}`;
                
                resultText += (
                    `${index < 3 ? bold(userText) : userText}\n` +
                    `     ⚔️ Win: ${user.wingame}  |  ⭐ Level: ${user.level}\n`
                );
                userMentions.push(`${user.id}@s.whatsapp.net`);
            });

            // Add user position if not in top 10
            if (userRank > 10) {
                const userData = await userHelper.getUser(senderJid);
                resultText += (
                    `\n\nPosisi Anda:\n` +
                    `${userRank}. @${senderJid}\n` +
                    `     ⚔️ Win: ${userData.wingame}  |  ⭐ Level: ${userData.level}\n`
                );
                userMentions.push(`${senderJid}@s.whatsapp.net`);
            }

            return await ctx.reply({
                text: `${bold(`🏆 LEADERBOARD RANK TOP 10`)}\n\n` +
                    `${resultText.trim()}\n\n` +
                    config.msg.footer,
                mentions: userMentions
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};