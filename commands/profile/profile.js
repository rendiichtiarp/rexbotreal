const {
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");

module.exports = {
    name: "me",
    aliases: ["me", "profile"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        try {
            // Cek apakah ada mention atau nomor telepon yang diberikan
            let targetJid = ctx.quoted?.participant || ctx.mentions?.[0] || ctx.args?.[0];
            let senderJid = ctx.sender.jid;
            
            // Jika ada nomor telepon yang diberikan (format: 62xxx)
            if (targetJid && !targetJid.includes('@') && targetJid.startsWith('62')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }
            
            // Jika tidak ada target, gunakan sender sendiri
            if (!targetJid) {
                targetJid = senderJid;
            }

            const targetId = tools.general.getID(targetJid);
            const userDb = await Database.getUser(targetId);
            
            // Jika user tidak ditemukan di database
            if (!userDb) {
                return await ctx.reply(quote("❎ Pengguna tidak ditemukan dalam database!"));
            }

            const isOwner = tools.general.isOwner(targetId);

            // Get all users for ranking
            const users = await Database.getAllUsers();
            const leaderboardData = users
                .map(user => ({
                    id: user.id,
                    win_game: user.win_game || 0,
                    level: user.level || 0
                }))
                .sort((a, b) => b.win_game - a.win_game || b.level - a.level);

            const userRank = leaderboardData.findIndex(user => user.id === targetId) + 1;
            const profilePictureUrl = await ctx.core.profilePictureUrl(targetJid, "image")
                .catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");
            const canvas = tools.api.createUrl("fast", "/canvas/rank", {
                avatar: profilePictureUrl,
                background: config.bot.thumbnail,
                username: userDb?.name,
                status: "online",
                level: userDb?.level,
                rank: userRank,
                currentXp: userDb?.xp,
                requiredXp: ((userDb?.level || 0) + 1) * 100
            });

            const text = `${quote(`Nama: ${userDb?.name || "-"}`)}\n` +
                `${quote(`Status: ${isOwner ? "Owner" : userDb?.premium ? "Premium" : "Free" || "-"}`)}\n` +
                `${quote(`Level: ${userDb?.level || "-"}`)}\n` +
                `${quote(`XP: ${userDb?.xp} / ${((userDb?.level || 0) + 1) * 100}`)}\n` +
                `${quote(`Koin: ${isOwner || userDb?.premium ? "Tak terbatas" : userDb?.coin || "-"}`)}\n` +
                `${quote(`Peringkat: ${userRank || "-"}`)}\n` +
                `${quote(`Menang: ${userDb?.win_game || "-"}`)}\n` +
                "\n" +
                config.msg.footer;

            try {
                return await ctx.reply({
                    image: {
                        url: canvas
                    },
                    mimetype: mime.lookup("png"),
                    caption: text
                });
            } catch (error) {
                if (error.status !== 200) return await ctx.reply(text);
            }
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};