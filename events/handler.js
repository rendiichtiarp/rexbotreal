const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const {
    Events
} = require("@mengkodingan/ckptw/lib/Constant");
const axios = require("axios");
const {
    exec
} = require("child_process");
const fs = require("fs");
const util = require("util");
const { connection } = require('../database/connection');
const userHelper = require('../database/users');
const menfessHelper = require('../database/menfess');
const botHelper = require('../database/bot');
const groupHelper = require('../database/groups');

// Utilitas
async function handleUserEvent(bot, m, type) {
    const {
        id,
        participants
    } = m;

    try {
        const groupId = id.split("@")[0];
        const groupDb = await groupHelper.getGroup(groupId);

        if (groupDb?.welcome === 1 || groupDb?.welcome === true) {
            const metadata = await bot.core.groupMetadata(id);

            for (const jid of participants) {
                const profilePictureUrl = await bot.core.profilePictureUrl(jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                const customText = type === "UserJoin" ? groupDb?.text_welcome : groupDb?.text_goodbye;
                const userTag = `@${jid.split("@")[0]}`;

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
                            mediaType: 1,
                            previewType: 0,
                            mediaUrl: config.bot.website,
                            title: config.msg.watermark,
                            body: null,
                            renderLargerThumbnail: true,
                            thumbnailUrl: profilePictureUrl || config.bot.thumbnail,
                            sourceUrl: config.bot.website
                        }
                    }
                });

                if (type === "UserJoin" && (groupDb?.intro === 1 || groupDb?.intro === true)) {
                    if (groupDb?.text_intro) {
                        await bot.core.sendMessage(id, {
                            text: groupDb.text_intro,
                            mentions: [jid]
                        });
                    }
                }
            }
        }
    } catch (error) {
        consolefy.error(`Error: ${error}`);
        await bot.core.sendMessage(id, {
            text: quote(`⚠️ Terjadi kesalahan: ${error.message}`)
        });
    }
}

// Tambahkan fungsi untuk reset data menfess
async function resetMenfessData() {
    await menfessHelper.resetMenfessData();
}

// Tambahkan fungsi untuk reset menfess harian
async function resetMenfessDaily() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    setTimeout(async () => {
        try {
            // Reset data menfess setiap tengah malam
            await resetMenfessData();

            // Siapkan pesan status reset
            const statusMessage = quote(
                `📊 Laporan Reset Menfess Harian\n\n` +
                `📅 Waktu: ${new Date().toLocaleString()}\n` +
                `✅ Data menfess telah direset.\n\n` +
                `⏰ Reset selanjutnya: ${nextMidnight.toLocaleString()}`
            );

            // Kirim pesan ke grup log
            await bot.core.sendMessage(config.bot.logGroupJid, {
                text: statusMessage
            });
            
            console.log(`[${config.pkg.name}] Berhasil reset menfess harian ${new Date().toLocaleString()}`);
            
            // Jalankan lagi untuk hari berikutnya
            resetMenfessDaily();
        } catch (error) {
            console.error(`[${config.pkg.name}] Error reset menfess harian:`, error);
            
            // Kirim pesan error ke grup dengan JID manual
            const errorMessage = quote(
                `⚠️ Error Reset Menfess Harian\n\n` +
                `📅 Waktu: ${new Date().toLocaleString()}\n` +
                `❌ Error: ${error.message}\n\n` +
                `🔃 Mencoba lagi dalam 1 menit...`
            );
            
            // Kirim pesan error ke grup log
            await bot.core.sendMessage(config.bot.logGroupJid, {
                text: errorMessage
            });
            
            // Coba lagi dalam 1 menit jika terjadi error
            setTimeout(resetMenfessDaily, 60000);
        }
    }, timeUntilMidnight);

    // Log informasi waktu reset berikutnya
    const nextResetTime = new Date(now.getTime() + timeUntilMidnight);
    console.log(`[${config.pkg.name}] Reset menfess harian selanjutnya pada: ${nextResetTime.toLocaleString()}`);
}

function isEnabled(value) {
    return value === true || value === 1;
}

module.exports = (bot) => {
    // Penanganan acara saat bot siap
    bot.ev.once(Events.ClientReady, async (m) => {
        console.log(`[${config.pkg.name}] ${config.bot.name} by ${config.owner.name} | Ready at ${m.user.id}`);

        const botRestart = await botHelper.getSetting("bot.restart") || null;
        if (botRestart) {
            try {
                const { jid, timestamp, key } = JSON.parse(botRestart);
                const timeago = tools.general.convertMsToDuration(Date.now() - timestamp);
                
                // Mengedit pesan yang ada
                await bot.core.sendMessage(jid, {
                    text: quote(`✅ Berhasil dimulai ulang! Membutuhkan waktu ${timeago}.`),
                    edit: key
                });

                // Menghapus data restart setelah digunakan
                await botHelper.deleteSetting("bot.restart");
            } catch (error) {
                console.error('Error parsing bot.restart:', error);
            }
        }

        // Tetapkan config pada bot
        const id = m.user.id.split(":")[0];
        await Promise.all([
            config.bot.id = id,
            config.bot.jid = `${id}@s.whatsapp.net`,
            config.bot.readyAt = bot.readyAt
        ]);

        if (config.system.requireBotGroupMembership) {
            const code = await bot.core.groupInviteCode(config.bot.groupJid);
            config.bot.groupLink = `https://chat.whatsapp.com/${code}`;
        }

        // Fungsi untuk mendapatkan jadwal shalat untuk multiple zona
        async function getPrayerSchedules() {
            try {
                // Definisi kota perwakilan untuk setiap zona
                const cities = {
                    WIB: { kota: "jakarta", nama: "Jakarta dan sekitarnya" },
                    WITA: { kota: "makassar", nama: "Makassar dan sekitarnya" },
                    WIT: { kota: "jayapura", nama: "Jayapura dan sekitarnya" }
                };

                const schedules = {};
                
                // Ambil jadwal untuk setiap kota
                for (const [zone, city] of Object.entries(cities)) {
                    const apiUrl = tools.api.createUrl("agatz", "/api/jadwalsholat", {
                        kota: city.kota
                    });
                    
                    const { data } = await axios.get(apiUrl);
                    
                    // Sesuaikan dengan struktur response API
                    schedules[zone] = {
                        subuh: data.data.subuh,
                        dzuhur: data.data.dhuhur,    // perhatikan spelling 'dhuhur' di API
                        ashar: data.data.ashar,
                        maghrib: data.data.maghrib,
                        isya: data.data.isya,
                        cityName: city.nama
                    };
                }
                
                return schedules;
            } catch (error) {
                console.error(`[${config.pkg.name}] Error mengambil jadwal shalat:`, error);
                return null;
            }
        }

        // Fungsi untuk mengecek waktu shalat
        async function checkPrayerTime() {
            try {
                const schedules = await getPrayerSchedules();
                if (!schedules) return;

                const now = new Date();
                
                // Fungsi helper untuk mendapatkan waktu berdasarkan zona
                const getZoneTime = (zone) => {
                    const offset = {
                        WIB: 7,
                        WITA: 8,
                        WIT: 9
                    }[zone];
                    
                    const zoneTime = new Date(now.getTime() + (offset - 7) * 60 * 60 * 1000);
                    return `${String(zoneTime.getHours()).padStart(2, '0')}:${String(zoneTime.getMinutes()).padStart(2, '0')}`;
                };

                // Tambahkan fungsi untuk format tanggal
                const formatDate = (date) => {
                    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    
                    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
                };

                // Cek untuk setiap zona waktu
                for (const [zone, schedule] of Object.entries(schedules)) {
                    const currentTime = getZoneTime(zone);
                    
                    const prayerTimes = {
                        subuh: schedule.subuh,
                        dzuhur: schedule.dzuhur,
                        ashar: schedule.ashar,
                        maghrib: schedule.maghrib,
                        isya: schedule.isya
                    };

                    for (const [prayer, time] of Object.entries(prayerTimes)) {
                        if (currentTime === time) {
                            const prayerName = prayer.charAt(0).toUpperCase() + prayer.slice(1);
                            const message = quote(
                                `🕌 Waktu Shalat ${prayerName}\n` +
                                `Untuk Wilayah ${schedule.cityName}\n\n` +
                                `📅 ${formatDate(now)}\n` +
                                `⏰ Pukul ${time} ${zone}\n\n` +
                                `"Shalat adalah tiang agama. Barangsiapa yang mendirikannya, maka ia telah mendirikan agamanya. Dan barangsiapa yang meninggalkannya, maka ia telah meruntuhkan agamanya."\n\n` +
                                `Mari kita tunaikan shalat tepat waktu 🤲`
                            );

                            // Kirim pesan ke grup yang mengaktifkan fitur shalat
                            const groups = await bot.core.groupFetchAllParticipating();
                            for (const groupId of Object.keys(groups)) {
                                const groupDb = await groupHelper.getGroup(groupId.split('@')[0]);
                                if (groupDb?.shalat === 1 || groupDb?.shalat === true) {
                                    await bot.core.sendMessage(groupId, {
                                        text: message,
                                        contextInfo: {
                                            externalAdReply: {
                                                mediaType: 1,
                                                previewType: 0,
                                                title: `Pengingat Waktu Shalat (${zone})`,
                                                body: config.msg.watermark,
                                                thumbnailUrl: "https://i.ibb.co/vQx8fvZ/mosque.png",
                                                sourceUrl: config.bot.website
                                            }
                                        }
                                    });
                                }
                            }

                            // Log ke console
                            console.log(`[${config.pkg.name}] Mengirim pengingat shalat ${prayerName} (${zone}) ke grup yang mengaktifkan fitur shalat`);
                        }
                    }
                }
            } catch (error) {
                console.error(`[${config.pkg.name}] Error dalam pengecekan waktu shalat:`, error);
            }
        }

        // Mulai interval pengecekan waktu shalat (setiap menit)
        setInterval(checkPrayerTime, 60000);

        // Jalankan pengecekan pertama kali
        checkPrayerTime();

        // Mulai penghitung waktu untuk reset menfess harian
        resetMenfessDaily();
    });

    // Penanganan event ketika pesan muncul
    bot.ev.on(Events.MessagesUpsert, async (m, ctx) => {
        const isGroup = ctx.isGroup();
            const isPrivate = !isGroup;

            const senderJid = ctx.sender.jid;
            const senderId = senderJid.split(/[:@]/)[0];
            const groupJid = isGroup ? ctx.id : null;
            const groupId = isGroup ? groupJid.split("@")[0] : null;

            // Basis data untuk pengguna
            let userDb = await userHelper.getUser(senderId);
            const isOwner = tools.general.isOwner(senderId);
            const isPremium = userDb?.premium;

            // Penanganan pada mode bot
            const botMode = await botHelper.getSetting("bot.mode") || "public";
            if (isPrivate && botMode === "group") return;
            if (isGroup && botMode === "private") return;
            if (!isOwner && botMode === "self") return;

            // Log pesan masuk
            const currentTime = new Date();
            const timeString = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`;
            
            if (isGroup) {
                consolefy.info(`[${timeString}] Pesan masuk dari grup: ${groupId}, oleh: ${senderId}`);
            } else {
                consolefy.info(`[${timeString}] Pesan masuk dari: ${senderId}`);
            }

            // Grup atau Pribadi
            if (isGroup || isPrivate) {

                // Penanganan basis data pengguna
                if (!userDb.no_user) {
                    try {
                        // Buat user baru jika belum ada
                        const newUserData = {
                            no_user: senderId,
                            user_limit: (isOwner || isPremium) ? 0 : 10,
                            coin: (isOwner || isPremium) ? 0 : 1000,
                            level: 0,
                            uid: tools.general.generateUID(senderId),
                            xp: 0,
                            premium: isPremium || false,
                            banned: false,
                            afk: false,
                            wingame: 0
                        };
                        await userHelper.createUser(newUserData);
                        
                        // Reload user data setelah create
                        userDb = await userHelper.getUser(senderId);
                    } catch (error) {
                        console.error('Error creating new user:', error);
                        // Handle error sesuai kebutuhan
                    }
                }

                // Penanganan untuk perintah
                const isCmd = tools.general.isCmd(m.content, ctx._config);
                if (isCmd) {
                    if (config.system.autoTypingOnCmd) await ctx.simulateTyping(); // Simulasi pengetikan otomatis untuk perintah

                    // Did you mean?
                    const mean = isCmd.didyoumean;
                    const prefix = isCmd.prefix;
                    const input = isCmd.input;

                    if (mean) {
                        if (mean) await ctx.reply(quote(`❎ Anda salah ketik, sepertinya ${monospace(prefix + mean)}.`));
                        return; // Jangan tambah XP jika command salah
                    }

                    // Penanganan XP & Level untuk pengguna (hanya jika command valid)
                    try {
                        // Tambah XP hanya jika command valid dan berhasil dieksekusi
                        const xpGain = 10; // XP tetap untuk setiap command
                        const xpResult = await userHelper.addXP(senderId, xpGain);

                        // Cek level up dan autolevelup dari database
                        if (xpResult.success && xpResult.newLevel > xpResult.oldLevel) {
                            // Dapatkan data user terbaru untuk cek status autolevelup
                            const updatedUserDb = await userHelper.getUser(senderId);
                            
                            // Cek jika autolevelup aktif
                            if (updatedUserDb.autolevelup) {
                                const profilePictureUrl = await ctx._client.profilePictureUrl(senderJid, "image")
                                    .catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                                await ctx.reply({
                                    text: `${quote(`Selamat! Kamu telah naik ke level ${xpResult.newLevel}!`)}\n` +
                                        `${config.msg.readmore}\n` +
                                        quote(tools.msg.generateNotes([`Terganggu? Ketik ${monospace(`${prefix}setprofile autolevelup`)} untuk menonaktifkan pesan autolevelup.`])),
                                    contextInfo: {
                                        externalAdReply: {
                                            mediaType: 1,
                                            previewType: 0,
                                            mediaUrl: config.bot.website,
                                            title: config.msg.watermark,
                                            body: null,
                                            renderLargerThumbnail: true,
                                            thumbnailUrl: profilePictureUrl || config.bot.thumbnail,
                                            sourceUrl: config.bot.website
                                        }
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Error in XP/Level handling:', error);
                    }
                }

                // Perintah khusus Owner
                if (isOwner) {
                    // Perintah Eval: Jalankan kode JavaScript
                    if (m.content && m.content.startsWith && (m.content.startsWith("==> ") || m.content.startsWith("=> "))) {
                        const code = m.content.slice(m.content.startsWith("==> ") ? 4 : 3);

                        try {
                            const result = await eval(m.content.startsWith("==> ") ? `(async () => { ${code} })()` : code);

                            await ctx.reply(monospace(util.inspect(result)));
                        } catch (error) {
                            consolefy.error(`Error: ${error}`);
                            await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
                        }
                    }

                    // Perintah Exec: Jalankan perintah shell
                    if (m.content && m.content.startsWith && m.content.startsWith("$ ")) {
                        const command = m.content.slice(2);

                        try {
                            const output = await util.promisify(exec)(command);

                            await ctx.reply(monospace(output.stdout || output.stderr));
                        } catch (error) {
                            consolefy.error(`Error: ${error}`);
                            await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
                        }
                    }
                }

                // Penanganan AFK: Pengguna yang disebutkan
                const mentionJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
                if (mentionJids && mentionJids.length > 0) {
                    for (const mentionJid of mentionJids) {
                        const mentionedUser = await userHelper.getAFKInfo(mentionJid.split('@')[0]);
                        if (mentionedUser?.afk) {
                            const timeago = tools.general.convertMsToDuration(Date.now() - mentionedUser.afk_time);
                            const reason = mentionedUser.afk_reason ? ` dengan alasan "${mentionedUser.afk_reason}"` : '';
                            await ctx.reply(quote(`💤 Dia sedang AFK${reason} (${timeago}).`));
                        }
                    }
                }

                // Penanganan AFK: Pengguna yang kembali
                if (userDb?.afk) {
                    const timeElapsed = Date.now() - userDb.afk_time;
                    if (timeElapsed > 3000) {
                        const timeago = tools.general.convertMsToDuration(timeElapsed);
                        await ctx.reply(quote(`💤 Kamu telah keluar dari AFK selama ${timeago}.`));
                        await userHelper.setAFK(senderId, false);
                    }
                }
            }

            // Grup
            if (isGroup) {
                if (m.key.fromMe) return;

                let groupDb = await groupHelper.getGroup(groupId);

                // Jika data grup belum ada, buat baru
                if (!groupDb) {
                    try {
                        const created = await groupHelper.createGroup(groupId);
                        if (created) {
                            groupDb = await groupHelper.getGroup(groupId);
                            console.log(`[${config.pkg.name}] Berhasil membuat data baru untuk grup: ${groupId}`);
                        } else {
                            console.log(`[${config.pkg.name}] Grup ${groupId} sudah ada di database`);
                            groupDb = await groupHelper.getGroup(groupId);
                        }
                    } catch (error) {
                        console.error(`[${config.pkg.name}] Error membuat data grup:`, error);
                        return; // Keluar jika gagal membuat data grup
                    }
                }

                // Pastikan groupDb ada sebelum melanjutkan
                if (!groupDb) {
                    console.error(`[${config.pkg.name}] Tidak bisa mendapatkan data grup: ${groupId}`);
                    return;
                }

                // Penanganan antilink
                if (groupDb?.antilink === 1 || groupDb?.antilink === true) {
                    if (tools.general.isUrl(m.content) && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                        await ctx.reply(quote(`⛔ Jangan kirim link!`));
                        await ctx.deleteMessage(m.key);
                        if (!config.system.restrict && (groupDb?.autokick === 1 || groupDb?.autokick === true)) {
                            await ctx.group().kick([senderJid]);
                            await ctx._client.sendMessage(senderJid, {
                                text: quote(`⚠️ Kamu dikick dari grup karena mengirim link.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                            });
                        }
                    }
                }

                // Penanganan antinsfw
                if (groupDb?.antinsfw === 1 || groupDb?.antinsfw === true) {
                    if (m.image && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                        const buffer = await ctx.msg.media.toBuffer();
                        const uploadUrl = await tools.general.upload(buffer);

                        const apiUrl = tools.api.createUrl("fasturl", "/tool/imagechecker", {
                            url: uploadUrl
                        });
                        const {
                            data
                        } = await axios.get(apiUrl);

                        if (data.results.status === "NSFW") {
                            await ctx.reply(`⛔ Jangan kirim NSFW!`);
                            await ctx.deleteMessage(m.key);
                            if (!config.system.restrict && (groupDb?.autokick === 1 || groupDb?.autokick === true)) {
                                await ctx.group().kick([senderJid]);
                                await ctx._client.sendMessage(senderJid, {
                                    text: quote(`⚠️ Kamu dikick dari grup karena mengirim NFSW.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                                });
                            }
                        }
                    }
                }

                // Penanganan antisticker
                if (groupDb?.antisticker === 1 || groupDb?.antisticker === true) {
                    if (m.sticker && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                        await ctx.reply(`⛔ Jangan kirim stiker!`);
                        await ctx.deleteMessage(m.key);
                        if (!config.system.restrict && (groupDb?.autokick === 1 || groupDb?.autokick === true)) {
                            await ctx.group().kick([senderJid]);
                            await ctx._client.sendMessage(senderJid, {
                                text: quote(`⚠️ Kamu dikick dari grup karena mengirim sticker.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                            });
                        }
                    }
                }

                // Penanganan antitoxic
                const toxicRegex = /anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol/i;
                if (groupDb?.antitoxic === 1 || groupDb?.antitoxic === true) {
                    if (m.content && toxicRegex.test(m.content) && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                        await ctx.reply(quote(`⛔ Jangan toxic!`));
                        await ctx.deleteMessage(m.key);
                        if (!config.system.restrict && (groupDb?.autokick === 1 || groupDb?.autokick === true)) {
                            await ctx.group().kick([senderJid]);
                            await ctx._client.sendMessage(senderJid, {
                                text: quote(`⚠️ Kamu dikick dari grup karena mengirim toxic.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                            });
                        }
                    }
                }
            }

            // Pribadi
            if (isPrivate) {
                if (m.key.fromMe) return;

                const isCmd = tools.general.isCmd(m.content, ctx._config);

                // Penanganan menfess
                const allMenfessDb = await menfessHelper.getMenfessByUser(senderId) || {};
                if ((!isCmd || isCmd.didyoumean) && allMenfessDb && Array.isArray(allMenfessDb) && allMenfessDb.length > 0) {
                    for (const menfessData of allMenfessDb) {
                        const { from_user, to_user } = menfessData;
                        const senderInConversation = senderId === from_user || senderId === to_user;

                        if (m.content && /^\b(delete|stop)\b$/i.test(m.content.trim()) && senderInConversation) {
                            const targetId = senderId === from_user ? to_user : from_user;
                            const message = senderId === from_user ? "✅ Sesi percakapan diakhiri oleh pengirim!" : "✅ Sesi percakapan diakhiri oleh penerima!";

                            await ctx.reply(quote(message));
                            await ctx.sendMessage(`${targetId}@s.whatsapp.net`, {
                                text: quote(message)
                            });
                            await menfessHelper.deleteMenfess(menfessData.id);
                            break;
                        }

                        if (senderInConversation) {
                            const targetId = senderId === from_user ? `${to_user}@s.whatsapp.net` : `${from_user}@s.whatsapp.net`;

                            await ctx._client.sendMessage(targetId, {
                                forward: m
                            });

                            break;
                        }
                    }
                }
            }
    });

    // Penanganan peristiwa ketika pengguna bergabung atau keluar dari grup
    bot.ev.on(Events.UserJoin, async (m) => handleUserEvent(bot, m, "UserJoin"));
    bot.ev.on(Events.UserLeave, async (m) => handleUserEvent(bot, m, "UserLeave"));
};