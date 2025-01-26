const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "profile",
    aliases: ["me", "prof", "profil"],
    category: "profile",
    handler: {},
    code: async (ctx) => {
        try {
            const mentionedJids = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            const userId = Array.isArray(mentionedJids) && mentionedJids.length > 0 ? mentionedJids[0] : ctx.sender.jid;

            const senderId = userId.split(/[:@]/)[0];
            const userDb = await db.get(`user.${senderId}`) || {};

            const isOwner = tools.general.isOwner(senderId);

            const leaderboardData = Object.entries((await db.toJSON()).user)
                .map(([id, data]) => ({
                    id,
                    winGame: data.winGame || 0,
                    level: data.level || 0
                }))
                .sort((a, b) => b.winGame - a.winGame || b.level - a.level);

            const userRank = leaderboardData.findIndex(user => user.id === senderId) + 1;

            const profilePictureUrl = await ctx._client.profilePictureUrl(userId, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

            return await ctx.reply({
                text: `*🎭 Profil Pengguna*\n\n` +
                    `*📝 Info Pribadi*\n` +
                    `👤 *Nama*: ${userDb?.name || "-"}\n` +
                    `🎂 *Umur*: ${userDb?.age ? userDb.age + " Tahun" : "-"}\n` +
                    `📅 *Tanggal Lahir*: ${userDb?.birthDate || "-"}\n` +
                    `✨ *Status*: ${isOwner ? "Pemilik" : userDb?.premium ? "Pengguna Premium" : "Pengguna Gratis" || "-"}\n\n` +
                    `*📊 Statistik*\n` +
                    `🪙 Koin: ${isOwner || userDb?.premium ? "∞" : userDb?.coin || "0"}\n` +
                    `⭐ Level: ${userDb?.level || "0"}\n` +
                    `🎉 XP: ${userDb?.xp || "0"}\n` +
                    `🏆 Game Win: ${userDb?.winGame || "0"}\n` +
                    `🏅 Ranking: #${userRank || "-"}\n\n` +
                    config.msg.footer,
                contextInfo: {
                    externalAdReply: {
                        mediaType: 1,
                        previewType: 0,
                        mediaUrl: config.bot.website,
                        title: `${userDb?.name || "Pengguna"} Profile`,
                        body: `Level ${userDb?.level || "0"} • Rank #${userRank || "-"}`,
                        renderLargerThumbnail: true,
                        thumbnailUrl: profilePictureUrl,
                        sourceUrl: config.bot.website
                    }
                }
            });
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};