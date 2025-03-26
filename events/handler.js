// Impor modul dan dependensi yang diperlukan
const {
    Events,
    monospace,
    quote,
    VCardBuilder
} = require("@mengkodingan/ckptw");
const Database = require('../lib/database/queries');
const axios = require("axios");
const {
    exec
} = require("node:child_process");
const fs = require("node:fs");
const util = require("node:util");

// Di bagian atas file, tambahkan variabel untuk tracking
let lastCheckedResetId = 0;

// Fungsi untuk menangani event pengguna bergabung/keluar grup
async function handleUserEvent(bot, m, type) {
    const {
        id,
        participants
    } = m;

    try {
        const groupId = tools.general.getID(id);
        const groupDb = await Database.getGroup(groupId);

        if (groupDb?.welcome) {
            const metadata = await bot.core.groupMetadata(id);

            for (const jid of participants) {
                const profilePictureUrl = await bot.core.profilePictureUrl(jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                const customText = type === "UserJoin" ? 
                    groupDb?.welcome_text : 
                    groupDb?.goodbye_text;
                const userTag = `@${tools.general.getID(jid)}`;

                const text = customText ?
                    customText
                    .replace(/%tag%/g, userTag)
                    .replace(/%subject%/g, metadata.subject)
                    .replace(/%description%/g, metadata.description) :
                    (type === "UserJoin" ?
                        quote(`👋 Selamat datang ${userTag} di grup ${metadata.subject}!`) :
                        quote(`👋 ${userTag} keluar dari grup ${metadata.subject}.`));

                await bot.core.sendMessage(id, {
                    text,
                    contextInfo: {
                        mentionedJid: [jid],
                        externalAdReply: {
                            title: config.msg.watermark,
                            mediaType: "VIDEO",
                            thumbnailUrl: profilePictureUrl,
                            sourceUrl: config.bot.website,
                            renderLargerThumbnail: true
                        }
                    }
                });

                if (type === "UserJoin" && groupDb?.intro_text) await bot.core.sendMessage(id, {
                    text: groupDb.intro_text,
                    mentions: [jid]
                });
            }
        }
    } catch (error) {
        consolefy.error(`Error: ${error}`);
        await bot.core.sendMessage(id, {
            text: quote(`❎ Terjadi kesalahan: ${error.message}`)
        });
    }
}

// Events utama bot
module.exports = (bot) => {
    // Event saat bot siap
    bot.ev.once(Events.ClientReady, async (m) => {
        consolefy.success(`${config.bot.name} by ${config.owner.name}, ready at ${m.user.id}`);
        const lastRestart = await Database.getLastRestart();

        if (lastRestart?.jid && lastRestart.timestamp) {
            const timeago = tools.general.convertMsToDuration(Date.now() - lastRestart.timestamp);
            await bot.core.sendMessage(lastRestart.jid, {
                text: quote(`✅ Berhasil dimulai ulang! Membutuhkan waktu ${timeago}.`),
                edit: JSON.parse(lastRestart.message_key)
            });
            
            await Database.deleteRestart();
        }

        // Tetapkan config pada bot
        const id = tools.general.getID(m.user.id);
        config.bot = {
            ...config.bot,
            id,
            jid: `${id}@s.whatsapp.net`,
            readyAt: bot.readyAt,
            groupLink: config.system.requireBotGroupMembership ? `https://chat.whatsapp.com/${await bot.core.groupInviteCode(config.bot.groupJid)}` : undefined
        };

        // Mulai interval untuk mengecek password reset baru
        setInterval(async () => {
            try {
                lastCheckedResetId = await Database.checkAndSendOTP(bot, lastCheckedResetId);
            } catch (error) {
                consolefy.error("Error in OTP check interval:", error);
            }
        }, 1000);
    });

    // Event saat bot menerima pesan
    bot.ev.on(Events.MessagesUpsert, async (m, ctx) => {
        // Variabel umum
        const isGroup = ctx.isGroup();
        const isPrivate = !isGroup;
        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? tools.general.getID(groupJid) : null;
        const isOwner = tools.general.isOwner(senderId);
        const isCmd = tools.general.isCmd(m.content, ctx.bot);

        // Mengambil data dari database
        const botMode = await Database.getBotMode();
        const userDb = await Database.getUser(senderId);
        const groupDb = isGroup ? await Database.getGroup(groupId) : null;

        if ((botMode === "group" && !isGroup) || (botMode === "private" && isGroup) || (botMode === "self" && !isOwner)) return;

        if (groupDb?.mute) return;

        isGroup ? consolefy.info(`Pesan masuk dari grup: ${groupId}, oleh: ${senderId}`) : consolefy.info(`Pesan masuk dari: ${senderId}`);

        // Grup atau Pribadi
        if (isGroup || isPrivate) {
            if (isCmd?.didyoumean) await ctx.reply(quote(`❎ Anda salah ketik, sepertinya ${monospace(isCmd?.prefix + isCmd?.didyoumean)}.`));

            // Perintah khusus Owner
            if (isOwner && m.content) {
                // Perintah Eval (Jalankan kode JavaScript)
                if (m.content.startsWith("==> ") || m.content.startsWith("=> ")) {
                    const code = m.content.slice(m.content.startsWith("==> ") ? 4 : 3);
                    try {
                        const result = await eval(m.content.startsWith("==> ") ? `(async () => { ${code} })()` : code);
                        await ctx.reply(monospace(util.inspect(result)));
                    } catch (error) {
                        consolefy.error(`Error: ${error}`);
                        await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
                    }
                }

                // Perintah Exec: (Jalankan perintah shell)
                if (m.content.startsWith("$ ")) {
                    const command = m.content.slice(2);
                    try {
                        const output = await util.promisify(exec)(command);
                        await ctx.reply(monospace(output.stdout || output.stderr));
                    } catch (error) {
                        consolefy.error(`Error: ${error}`);
                        await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
                    }
                }
            }

            // Penanganan AFK
            if (ctx.quoted?.senderJid || m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                const userAFKJids = ctx.quoted?.senderJid ? 
                    [tools.general.getID(ctx.quoted.senderJid)] : 
                    m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.map(jid => tools.general.getID(jid)) || [];

                if (userAFKJids.length > 0) {
                    if (m.key.fromMe) return;

                    for (const userAFKJid of userAFKJids) {
                        const userAFK = await Database.getUser(userAFKJid);
                        if (userAFK?.afk_reason && userAFK?.afk_timestamp) {
                            const timeago = tools.general.convertMsToDuration(Date.now() - userAFK.afk_timestamp);
                            await ctx.reply(quote(`📴 Dia sedang AFK ${userAFK.afk_reason ? `dengan alasan "${userAFK.afk_reason}"` : "tanpa alasan"} selama ${timeago}.`));
                        }
                    }
                }
            }

            // Penanganan AFK pengirim
            if (userDb?.afk_timestamp) {
                const timeElapsed = Date.now() - userDb.afk_timestamp;
                if (timeElapsed > 3000) {
                    const timeago = tools.general.convertMsToDuration(timeElapsed);
                    await ctx.reply(quote(`📴 Anda telah keluar dari AFK ${userDb.afk_reason ? `dengan alasan "${userDb.afk_reason}"` : "tanpa alasan"} selama ${timeago}.`));
                    await Database.removeAfk(senderId);
                }
            }
        }

        // Penanganan obrolan grup
        if (isGroup && !m.key.fromMe) {
            const now = Date.now();

            // Penanganan antilink
            if (groupDb?.antilink && await tools.general.isUrl(m.content) && !await ctx.group().isSenderAdmin()) {
                await ctx.reply(quote(`⛔ Jangan kirim tautan!`));
                await ctx.deleteMessage(m.key);
                if (!config.system.restrict && groupDb?.autokick) await ctx.group().kick([ctx.sender.jid]);
            }

            // Penanganan antinsfw
            if (groupDb?.antinsfw) {
                const checkMedia = await tools.general.checkMedia(ctx.getMessageType(), "image");
                if (checkMedia && !await ctx.group().isSenderAdmin()) {
                    const buffer = await ctx.msg.media.toBuffer();
                    const uploadUrl = await tools.general.upload(buffer, "image");
                    const apiUrl = tools.api.createUrl("fast", "/tool/imagechecker", {
                        url: uploadUrl
                    });
                    const result = (await axios.get(apiUrl)).data.result.status.toLowerCase();

                    if (result === "nsfw") {
                        await ctx.reply(quote(`⛔ Jangan kirim NSFW!`));
                        await ctx.deleteMessage(m.key);
                        if (!config.system.restrict && groupDb?.autokick) await ctx.group().kick([ctx.sender.jid]);
                    }
                }
            }

            // Penanganan antispam
            if (groupDb?.antispam) {
                const key = `group.${groupId}.spam.${senderId}`;
                const spamData = await Database.getSpamCount(key);
                const { count = 0, lastMessageTime = 0 } = spamData;
                const timeDiff = now - lastMessageTime;
                const newCount = timeDiff < 5000 ? count + 1 : 1;

                await Database.updateSpamCount(key, {
                    count: newCount,
                    lastMessageTime: now
                });

                if (newCount > 5) {
                    await ctx.reply(quote(`⛔ Jangan spam!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.autokick) await ctx.group().kick([ctx.sender.jid]);
                    await Database.deleteSpamCount(key);
                }
            }

            // Penanganan antisticker
            if (groupDb?.antisticker) {
                const checkMedia = await tools.general.checkMedia(ctx.getMessageType(), "sticker");
                if (checkMedia && !await ctx.group().isSenderAdmin()) {
                    await ctx.reply(quote(`⛔ Jangan kirim stiker!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.autokick) await ctx.group().kick([ctx.sender.jid]);
                }
            }

            // Penanganan antitoxic
            if (groupDb?.antitoxic) {
                const toxicRegex = /anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol/i;
                if (m.content && toxicRegex.test(m.content) && !await ctx.group().isSenderAdmin()) {
                    await ctx.reply(quote(`⛔ Jangan toxic!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.autokick) await ctx.group().kick([ctx.sender.jid]);
                }
            }
        }

        // Penanganan obrolan pribadi
        if (isPrivate && !m.key.fromMe) {
            // Penanganan menfess
            const allMenfessDb = await Database.getMenfess();
            const activeMenfess = allMenfessDb.filter(m => m.status === 'active');
            const menfessEntries = activeMenfess.map(m => [m.menfess_id, { from: m.from_user, to: m.to_user }]);
            
            if (!isCmd || isCmd.didyoumean) {
                for (const [conversationId, menfessData] of menfessEntries) {
                    const { from, to } = menfessData;
                    if (senderId === from || senderId === to) {
                        if (m.content.match(/\b(delete|stop)\b/i)) {
                            await ctx.reply(quote("✅ Pesan menfess telah diakhiri!"));
                            await ctx.sendMessage(`${senderId === from ? to : from}@s.whatsapp.net`, {
                                text: quote("✅ Pesan menfess telah diakhiri!")
                            });
                            await Database.updateMenfess(conversationId, {
                                status: 'done',
                                last_message: new Date().toLocaleString('en-US', { 
                                    timeZone: 'Asia/Jakarta',
                                    hour12: false 
                                }).replace(/(\d+)\/(\d+)\/(\d+),\s+/, '$3-$1-$2 ')
                            });
                        } else {
                            await ctx.core.sendMessage(senderId === from ? `${to}@s.whatsapp.net` : `${from}@s.whatsapp.net`, {
                                forward: m
                            });
                            // Update timestamp pesan terakhir menggunakan format 24 jam
                            await Database.updateMenfess(conversationId, {
                                last_message: new Date().toLocaleString('en-US', { 
                                    timeZone: 'Asia/Jakarta',
                                    hour12: false 
                                }).replace(/(\d+)\/(\d+)\/(\d+),\s+/, '$3-$1-$2 ')
                            });
                        }
                    }
                }
            }
        }
    });

    // Event saat bot menerima panggilan
    bot.ev.on(Events.Call, async (calls) => {
        if (!config.system.antiCall) return;

        for (let call of calls) {
            if (call.status !== "offer") continue;

            const vcard = new VCardBuilder()
                .setFullName(config.owner.name)
                .setOrg(config.owner.organization)
                .setNumber(config.owner.id).build();
            let rejectionMessage = await bot.core.sendMessage(call.from, {
                text: `Saat ini, kami tidak dapat menerima panggilan ${call.isVideo ? "video" : "suara"}.\n` +
                    `Jika Anda memerlukan bantuan, silakan menghubungi Owner.`,
                mentions: [call.from]
            });
            await bot.core.sendMessage(call.from, {
                contacts: {
                    displayName: config.owner.name,
                    contacts: [{
                        vcard
                    }]
                }
            }, {
                quoted: rejectionMessage
            });
            await bot.core.rejectCall(call.id, call.from);
        }
    });

    // Event saat pengguna bergabung atau keluar dari grup
    bot.ev.on(Events.UserJoin, async (m) => handleUserEvent(bot, m, "UserJoin"));
    bot.ev.on(Events.UserLeave, async (m) => handleUserEvent(bot, m, "UserLeave"));
};