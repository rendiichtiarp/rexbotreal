const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "me",
    aliases: ["me", "profile"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        try {
            const senderName = ctx.sender.pushName;
            const senderJid = ctx.sender.jid;
            const senderId = tools.general.getID(senderJid);

            const userDb = await Database.getUser(senderId);
            const isOwner = tools.general.isOwner(senderId);

            // Get all users for ranking
            const users = await Database.getAllUsers();
            const leaderboardData = users
                .map(user => ({
                    id: user.id,
                    win_game: user.win_game || 0,
                    level: user.level || 0
                }))
                .sort((a, b) => b.win_game - a.win_game || b.level - a.level);

            const userRank = leaderboardData.findIndex(user => user.id === senderId) + 1;
            const profilePictureUrl = await ctx.core.profilePictureUrl(senderJid, "image")
                .catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

            return await ctx.reply({
                text: `${quote(`Nama: ${senderName || "-"}`)}\n` +
                    `${quote(`Status: ${isOwner ? "Owner" : userDb?.premium ? "Premium" : "Free" || "-"}`)}\n` +
                    `${quote(`Level: ${userDb?.level || "-"}`)}\n` +
                    `${quote(`XP: ${userDb?.xp || "-"}`)}\n` +
                    `${quote(`Koin: ${isOwner || userDb?.premium ? "Tak terbatas" : userDb?.coin || "-"}`)}\n` +
                    `${quote(`Peringkat: ${userRank || "-"}`)}\n` +
                    `${quote(`Menang: ${userDb?.win_game || "-"}`)}\n` +
                    "\n" +
                    config.msg.footer,
                contextInfo: {
                    externalAdReply: {
                        title: config.msg.watermark,
                        previewType: "PHOTO",
                        mediaType: 1,
                        thumbnailUrl: profilePictureUrl,
                        mediaUrl: config.bot.website,
                        sourceUrl: config.bot.website,
                        renderLargerThumbnail: true
                    }
                }
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};