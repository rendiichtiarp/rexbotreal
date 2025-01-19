const {
    Cooldown,
    quote
} = require("@mengkodingan/ckptw");

// Penanganan opsi khusus
async function handler(ctx, options) {
    const isGroup = ctx.isGroup();
    const isPrivate = !isGroup;
    const senderJid = ctx.sender.jid;
    const senderId = senderJid.split(/[:@]/)[0];
    const userDb = await db.get(`user.${senderId}`) || {};
    const isOwner = tools.general.isOwner(senderId);

    const botMode = await db.get("bot.mode") || "public";
    if (isPrivate && botMode === "group") {
        if (!userDb?.premium && !isOwner) {
            await ctx.reply(config.msg.groupMode);
            return true;
        }
    }
    if (isGroup && botMode === "private") return true;
    if (!tools.general.isOwner(senderId, true) && botMode === "self") return true;

    if (config.system.requireBotGroupMembership && !isOwner && !userDb?.premium) {
        const botGroupMembersId = (await ctx.group()(config.bot.groupJid).members()).map(member => member.id.split("@")[0]);
        if (!botGroupMembersId.includes(senderId)) {
            await ctx.reply({
                text: config.msg.botGroupMembership,
                contextInfo: {
                    externalAdReply: {
                        mediaType: 1,
                        previewType: 0,
                        mediaUrl: config.bot.groupLink,
                        title: config.msg.watermark,
                        body: null,
                        renderLargerThumbnail: true,
                        thumbnailUrl: config.bot.thumbnail,
                        sourceUrl: config.bot.groupLink
                    },
                }
            });
            return true;
        }
    }

    if (userDb?.banned) {
        await ctx.reply(config.msg.banned);
        return true;
    }

    const cooldown = new Cooldown(ctx, config.system.cooldown);
    if (cooldown.onCooldown && !isOwner && !userDb?.premium) {
        const timeLeftInSeconds = cooldown.timeleft / 1000;
        const formattedTimeLeft = timeLeftInSeconds.toFixed(2);
        
        // Mengirim pesan awal
        const message = await ctx.reply(quote('🔃 Perintah bisa digunakan dalam ' + formattedTimeLeft + ' detik lagi, sabar...'));
        
        // Menunggu hingga cooldown habis
        setTimeout(async () => {
            // Mengedit pesan setelah cooldown habis
            await ctx.editMessage(message.key, quote('✅ Perintah sudah bisa digunakan kembali!'));
        }, cooldown.timeleft); // Menggunakan waktu cooldown yang tersisa

        return true;
    }

    const checkOptions = {
        admin: {
            check: async () => (await ctx.isGroup() && !await tools.general.isAdmin(ctx.group(), senderJid)),
            msg: config.msg.admin
        },
        botAdmin: {
            check: async () => (await ctx.isGroup() && !await tools.general.isBotAdmin(ctx.group())),
            msg: config.msg.botAdmin
        },
        coin: {
            check: async () => await checkCoin(options.coin, senderId) && config.system.useCoin,
            msg: config.msg.coin
        },
        limit: {
            check: async () => await checkLimit(options.limit, senderId, ctx.isGroup()) && config.system.useLimit,
            msg: config.msg.limit
        },
        group: {
            check: async () => !await ctx.isGroup(),
            msg: config.msg.group
        },
        onlyGroup: {
            check: async () => !isOwner && !userDb?.premium && !await ctx.isGroup(),
            msg: config.msg.onlyGroup
        },
        owner: {
            check: () => !isOwner,
            msg: config.msg.owner
        },
        premium: {
            check: () => !isOwner && !userDb?.premium,
            msg: config.msg.premium
        },
        private: {
            check: async () => await ctx.isGroup(),
            msg: config.msg.private
        },
        restrict: {
            check: () => config.system.restrict,
            msg: config.msg.restrict
        }
    };

    for (const [option, {
            check,
            msg
        }] of Object.entries(checkOptions)) {
        if (options[option] && typeof check === "function" && await check()) {
            await ctx.reply(msg);
            return true;
        }
    }

    return false;
}

// Cek koin
async function checkCoin(requiredCoin, senderId) {
    const isOwner = tools.general.isOwner(senderId);
    const userDb = await db.get(`user.${senderId}`) || {};

    if (isOwner || userDb?.premium) return false;

    const userCoin = userDb?.coin || 0;

    if (userCoin < requiredCoin) return true;

    await db.subtract(`user.${senderId}.coin`, requiredCoin);
    return false;
}

// Cek limit
async function checkLimit(requiredLimit, senderId, isGroup = false) {
    const isOwner = tools.general.isOwner(senderId);
    const userDb = await db.get(`user.${senderId}`) || {};

    // Jika owner, premium, atau dalam grup, limit tidak digunakan
    if (isOwner || userDb?.premium || isGroup) return false;

    const userLimit = userDb?.limit || 0;

    if (userLimit < requiredLimit) return true;

    await db.subtract(`user.${senderId}.limit`, requiredLimit);
    return false;
}

module.exports = handler;