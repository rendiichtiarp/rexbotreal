// Impor modul dan dependensi yang diperlukan
const {
    Cooldown,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const Database = require('./lib/database/queries');
const mime = require("mime-types");

// Fungsi untuk mengecek apakah pengguna memiliki cukup koin sebelum menggunakan perintah tertentu
async function checkCoin(requiredCoin, senderId) {
    const userDb = await Database.getUser(senderId);

    if (tools.general.isOwner(senderId) || userDb?.premium) return false;
    if (!userDb || (userDb?.coin || 0) < requiredCoin) return true;

    await Database.updateUser(senderId, {
        coin: userDb?.coin - requiredCoin
    });
    return false;
}

// Middleware utama bot
module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        try {
            // Variabel umum
            const isGroup = ctx.isGroup();
            const isPrivate = !isGroup;
            const senderJid = ctx.sender.jid;
            const senderId = tools.general.getID(senderJid);
            const groupJid = isGroup ? ctx.id : null;
            const groupId = isGroup ? tools.general.getID(groupJid) : null;
            const isOwner = tools.general.isOwner(senderId);

            // Mengambil data dari database
            const botMode = await Database.getBotMode();
            const userDb = await Database.getUser(senderId);
            const groupDb = isGroup ? await Database.getGroup(groupId) : null;

            // Pengecekan mode bot dan mute grup
            if (botMode === "group" && !isGroup) return;
            if (botMode === "private" && isGroup) return;
            if (botMode === "self" && !isOwner) return;
            if (groupDb?.mute && ctx.used.command !== "unmute") return;

            if (config.system.autoTypingOnCmd) await ctx.simulateTyping();

            // Menangani XP dan Level
            const xpGain = Math.floor(Math.random() * 15) + 5; // Random 5-20 XP per pesan
            let currentLevel = userDb?.level || 0;

            // Rumus XP yang dibutuhkan untuk level up:
            // Level 1: 100 XP
            // Level 2: 200 XP
            // Level 3: 300 XP
            // Level 4: 400 XP dst
            const xpToLevelUp = (currentLevel + 1) * 100;

            let currentXp = (userDb?.xp || 0) + xpGain;

            if (currentXp >= xpToLevelUp) {
                // Level up
                currentXp -= xpToLevelUp;
                currentLevel += 1;

                // Kirim pesan level up jika autolevelup aktif
                const profilePictureUrl = await ctx.core.profilePictureUrl(ctx.sender.jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                const canvas = tools.api.createUrl("fast", "/canvas/levelup", {
                    avatar: profilePictureUrl,
                    background: config.bot.thumbnail,
                    username: userDb?.name,
                    borderColor: "0068ff",
                    avatarBorderColor: "0068ff",
                    currentLevel: userDb?.level,
                    nextLevel: currentLevel
                });
    
                if (userDb?.autolevelup) await ctx.reply({
                    image: {
                        url: canvas
                    },
                    mimetype: mime.lookup("png"),
                    caption: `${quote(`Selamat! Kamu telah naik ke level ${currentLevel}!`)}\n` +
                        `${config.msg.readmore}\n` +
                        quote(tools.msg.generateNotes([`Terganggu? Ketik ${monospace(`${ctx.used.prefix}setprofile autolevelup`)} untuk menonaktifkan pesan autolevelup.`])),
                });
            }

            // Update XP dan Level user
            await Database.updateUser(senderId, {
                xp: currentXp,
                level: currentLevel
            });

            const text = quote(`❎ Anda belum bergabung ke komunitas RexbotX\n> Bergabung untuk mendapatkan akses penuh ke fitur RexbotX!` +
                `${(config.bot.groupLink + "\n\n> Jika belum bergabung, akan diberikan reaksi 🚫")}`);

            // Pengecekan kondisi pengguna
            const restrictions = [{
                    condition: userDb?.banned,
                    msg: config.msg.banned,
                    reaction: "🚫",
                    key: "has_sent_banned"
                },
                {
                    condition: !isOwner && !userDb?.premium && new Cooldown(ctx, config.system.cooldown).onCooldown,
                    msg: config.msg.cooldown,
                    reaction: "🔄",
                    afterCooldown: "✅",
                    key: "has_sent_cooldown"
                },
                {
                    condition: config.system.requireBotGroupMembership && ctx.used.command !== "botgroup" && !isOwner && !userDb?.premium && !(await ctx.group(config.bot.groupJid).members()).some(member => tools.general.getID(member.id) === senderId),
                    msg: text,
                    contextInfo: {
                        externalAdReply: {
                            title: config.msg.watermark,
                            mediaType: "IMAGE",
                            thumbnailUrl: config.bot.thumbnail,
                            sourceUrl: config.bot.website,
                            renderLargerThumbnail: true
                        }
                    },
                    reaction: "🚫",
                    key: "has_sent_requireBotGroupMembership"
                },
                {
                    condition: !userDb?.registered && !["register", "daftar", "reg", "regist", "verif", "verify", "caradaftar"].includes(ctx.used.command),
                    msg: config.msg.register,
                    reaction: "📝",
                    alwaysNotify: true
                }
            ];

            for (const {
                    condition,
                    msg,
                    reaction,
                    afterCooldown,
                    key,
                    alwaysNotify
                }
                of restrictions) {
                if (condition) {
                    if (alwaysNotify || !userDb?.[key]) {
                        await ctx.reply(msg);
                        if (!alwaysNotify && key) {
                            await Database.updateUser(senderId, {
                                [key]: true
                            });
                        }
                    } else {
                        await ctx.react(ctx.id, reaction);
                        if (afterCooldown) {
                            setTimeout(async () => {
                                await ctx.react(ctx.id, afterCooldown);
                                setTimeout(async () => {
                                    await ctx.react(ctx.id, "");
                                }, 2000);
                            }, config.system.cooldown);
                        }
                    }
                    return;
                }
            }

            // Terapkan random delay untuk non-premium user setelah pemeriksaan cooldown
            if (!isOwner && !userDb?.premium) {
                await tools.general.randomDelay();
            }

            // Pengecekan izin
            const command = [...ctx.bot.cmd.values()].find(cmd => [cmd.name, ...(cmd.aliases || [])].includes(ctx.used.command));
            if (!command) return next();
            const {
                permissions = {}
            } = command;
            const permissionChecks = [{
                    key: "admin",
                    condition: isGroup && !await ctx.group().isSenderAdmin(),
                    msg: config.msg.admin
                },
                {
                    key: "botAdmin",
                    condition: isGroup && !await ctx.group().isBotAdmin(),
                    msg: config.msg.botAdmin
                },
                {
                    key: "coin",
                    condition: permissions.coin && config.system.useCoin && await checkCoin(permissions.coin, senderId),
                    msg: config.msg.coin
                },
                {
                    key: "group",
                    condition: !isGroup,
                    msg: config.msg.group
                },
                {
                    key: "owner",
                    condition: !isOwner,
                    msg: config.msg.owner
                },
                {
                    key: "premium",
                    condition: !isOwner && !userDb?.premium,
                    msg: config.msg.premium
                },
                {
                    key: "private",
                    condition: isGroup,
                    msg: config.msg.private
                },
                {
                    key: "restrict",
                    condition: config.system.restrict,
                    msg: config.msg.restrict
                }
            ];

            for (const {
                    key,
                    condition,
                    msg
                }
                of permissionChecks) {
                if (permissions[key] && condition) {
                    return await ctx.reply(msg);
                }
            }

            await next();
        } catch (error) {
            console.error("Middleware error:", error);
        }
    });
};