const {
    Cooldown,
    quote,
    monospace
} = require("@mengkodingan/ckptw");
const userHelper = require('./database/users');
const botHelper = require('./database/bot');

// Fungsi untuk memformat tanggal
function formatTanggal(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Penanganan opsi khusus
async function handler(ctx, options) {
    const isGroup = ctx.isGroup();
    const isPrivate = !isGroup;
    const senderJid = ctx.sender.jid;
    const senderId = senderJid.split(/[:@]/)[0];
    const userDb = await userHelper.getUser(senderId);
    const isOwner = tools.general.isOwner(senderId);

    if (config.system.requireBotGroupMembership && !isOwner && !userDb?.premium) {
        const botGroupMembersId = (await ctx.group(config.bot.groupJid).members()).map(member => member.id.split("@")[0]);
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

    const botMode = await botHelper.getSetting("bot.mode") || "public";
    if (isPrivate && botMode === "group") {
        if (!userDb?.premium && !isOwner) {
            return ctx.react(ctx.id, '👥');
        }
    }
    if (isGroup && botMode === "private") return true;
    if (!tools.general.isOwner(senderId, true) && botMode === "self") return true;

    if (userDb?.banned) {
        await ctx.reply(config.msg.banned);
        return true;
    }

    const cooldown = new Cooldown(ctx, config.system.cooldown);
    if (cooldown.onCooldown && !isOwner && !userDb?.premium) {
    
        // Memberikan react ke pesan
        await ctx.react(ctx.id, '🔃');
        
        // Menunggu hingga cooldown habis
        setTimeout(async () => {
            // Memberikan react ke pesan setelah cooldown habis
            await ctx.react(ctx.id, '✅');
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
            check: async () => await checkLimit(ctx, options.limit, senderId) && config.system.useLimit,
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
        },
        register: {
            check: async () => {
                if (isOwner) return false;
                const userDb = await userHelper.getUser(senderId);
                
                // Periksa apakah pengguna terdaftar
                return !userDb.registered;
            },
            msg: quote(`🚫 Tidak dapat melanjutkan perintah karena Anda belum terdaftar.\n\n`) +
                (`*Ketik:*\n\`${ctx._used.prefix}daftar NamaAnda ${formatTanggal(new Date())}\`\n\nGanti \`NamaAnda\` dengan nama Anda dan \`${formatTanggal(new Date())}\` dengan tanggal lahir Anda.`)
        }
    };

    // Cek registrasi terlebih dahulu sebelum opsi lainnya
    if (options && !options.skipRegisterCheck) { // Skip untuk command register
        const registerCheck = checkOptions.register;
        if (typeof registerCheck.check === "function" && await registerCheck.check()) {
            await ctx.reply(registerCheck.msg);
            return true;
        }
    }

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
    const userDb = await userHelper.getUser(senderId);

    if (isOwner || userDb?.premium) return false;

    const userCoin = userDb?.coin || 0;

    if (userCoin < requiredCoin) return true;

    // Kurangi coin sesuai yang dibutuhkan
    await userHelper.updateUserCoin(senderId, -requiredCoin);
    return false;
}

// Cek limit
async function checkLimit(ctx, requiredLimit, senderId) {
    const isGroup = ctx.isGroup();
    const isOwner = tools.general.isOwner(senderId);
    const userDb = await userHelper.getUser(senderId);

    // Jika dalam grup, limit tidak akan berkurang
    if (isOwner || userDb?.premium || isGroup) return false;

    const userLimit = userDb?.user_limit || 0;

    if (userLimit < requiredLimit) return true;

    // Kurangi limit sesuai yang dibutuhkan
    await userHelper.updateUserLimit(senderId, -requiredLimit);
    return false;
}

module.exports = handler;