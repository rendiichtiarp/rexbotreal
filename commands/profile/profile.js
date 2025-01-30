const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');
const { connection } = require('../../database/connection');

module.exports = {
    name: "profile",
    aliases: ["me", "prof", "profil"],
    category: "profile",
    handler: {},
    code: async (ctx) => {

        if (await handler(ctx, module.exports.handler)) return;
        
        try {
            const mentionedJids = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            const userId = Array.isArray(mentionedJids) && mentionedJids.length > 0 ? mentionedJids[0] : ctx.sender.jid;

            const senderId = userId.split(/[:@]/)[0];
            
            // Get user data from MySQL
            const userDb = await userHelper.getUser(senderId);
            const isOwner = tools.general.isOwner(senderId);

            // Get user rank using the new helper function
            const userRank = await userHelper.getUserRank(senderId);

            const profilePictureUrl = await ctx._client.profilePictureUrl(userId, "image")
                .catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

            return await ctx.reply({
                text: `*🎭 Profil Pengguna*\n\n` +
                    `*📝 Info Pribadi*\n` +
                    `🆔 *UID*: ${userDb?.uid || "-"}\n` +
                    `👤 *Nama*: ${userDb?.name || "-"}\n` +
                    `🎂 *Umur*: ${userDb?.age ? userDb.age + " Tahun" : "-"}\n` +
                    `📅 *Tanggal Lahir*: ${userDb?.birth_date ? new Date(userDb.birth_date).toLocaleDateString('id-ID') : "-"}\n` +
                    `✨ *Status*: ${isOwner ? "Pemilik" : userDb?.premium ? "Pengguna Premium" : "Pengguna Gratis" || "-"}\n\n` +
                    `📊 *Statistik*\n` +
                    `🪙 *Koin*: ${isOwner || userDb?.premium ? "∞" : userDb?.coin || "0"}\n` +
                    `⭐ *Level*: ${userDb?.level || "0"}\n` +
                    `🎉 *XP*: ${userDb?.xp || "0"}\n` +
                    `🏆 *Game Win*: ${userDb?.wingame || "0"}\n` +
                    `🏅 *Ranking*: #${userRank || "-"}\n` +
                    `📉 *Limit*: ${userDb?.user_limit || "0"}\n\n` +
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
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};