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

// Utilitas
async function handleUserEvent(core, m, type) {
    const {
        id,
        participants
    } = m;

    try {
        const groupId = id.split("@")[0];
        const groupDb = await db.get(`group.${groupId}`) || {};

        if (groupDb?.option?.welcome) {
            const metadata = await core.groupMetadata(id);

            for (const jid of participants) {
                const profilePictureUrl = await core.profilePictureUrl(jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                const eventType = m.eventsType;
                const customText = type === "UserJoin" ? groupDb?.text?.welcome : groupDb?.text?.goodbye;
                const userTag = `@${jid.split("@")[0]}`;

                const text = customText ?
                    customText
                    .replace(/%tag%/g, userTag)
                    .replace(/%subject%/g, metadata.subject)
                    .replace(/%description%/g, metadata.description) :
                    (eventType === "UserJoin" ?
                        quote(`👋 Selamat datang ${userTag} di grup ${metadata.subject}!`) :
                        quote(`👋 ${userTag} keluar dari grup ${metadata.subject}.`));

                    await core.sendMessage(id, {
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

                if (type === "UserJoin" && groupDb?.text?.intro) await core.sendMessage(id, {
                    text: groupDb?.text?.intro,
                    mentions: [jid]
                });
            }
        }
    } catch (error) {
        console.error(`[${config.pkg.name}] Error:`, error);
        await core.sendMessage(id, {
            text: quote(`⚠️ Terjadi kesalahan: ${error.message}`)
        });
    }
}

module.exports = (bot) => {
    // Penanganan acara saat bot siap
    bot.ev.once(Events.ClientReady, async (m) => {
        console.log(`[${config.pkg.name}] ${config.bot.name} by ${config.owner.name} | Ready at ${m.user.id}`);

        const botRestart = await db.get("bot.restart") || {};
        if (botRestart && botRestart.jid && botRestart.timestamp) {
            const timeago = tools.general.convertMsToDuration(Date.now() - botRestart.timestamp);
            await core.sendMessage(botRestart.jid, {
                text: quote(`✅ Berhasil dimulai ulang! Membutuhkan waktu ${timeago}.`),
                edit: botRestart.key
            });
            db.delete("bot.restart");
        }

        // Tetapkan config pada bot
        const id = m.user.id.split(":")[0];
        await Promise.all([
            config.bot.id = id,
            config.bot.jid = `${id}@s.whatsapp.net`,
            config.bot.readyAt = bot.readyAt
        ]);

        if (config.system.requireBotGroupMembership) {
            const code = await core.groupInviteCode(config.bot.groupJid);
            config.bot.groupLink = `https://chat.whatsapp.com/${code}`;
        }

        // Tambahkan fungsi untuk reset limit harian
        async function resetDailyLimit() {
            const now = new Date();
            const nextMidnight = new Date(now);
            nextMidnight.setHours(24, 0, 0, 0);
            
            const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

            setTimeout(async () => {
                try {
                    // Ambil semua data user
                    const allUsers = await db.get("user") || {};
                    let successCount = 0;
                    let failedCount = 0;
                    
                    // Reset limit untuk setiap user non-premium
                    for (const [userId, userData] of Object.entries(allUsers)) {
                        try {
                            if (!userData.premium && !tools.general.isOwner({ sender: { jid: userId } }, userId.split(/[:@]/)[0], config.system.selfOwner)) {
                                await db.set(`user.${userId}.limit`, 10);
                                successCount++;
                            }
                        } catch (err) {
                            console.error(`Gagal reset limit untuk user ${userId}:`, err);
                            failedCount++;
                        }
                    }
                    
                    // Siapkan pesan status reset
                    const statusMessage = quote(
                        `📊 Laporan Reset Limit Harian\n\n` +
                        `📅 Waktu: ${new Date().toLocaleString()}\n` +
                        `✅ Berhasil: ${successCount} user\n` +
                        `❌ Gagal: ${failedCount} user\n\n` +
                        `⏰ Reset selanjutnya: ${nextMidnight.toLocaleString()}`
                    );

                    // Kirim pesan ke grup log
                    await bot.core.sendMessage(config.bot.logGroupJid, {
                        text: statusMessage
                    });
                    
                    console.log(`[${config.pkg.name}] Berhasil reset limit harian ${new Date().toLocaleString()}`);
                    
                    // Jalankan lagi untuk hari berikutnya
                    resetDailyLimit();
                } catch (error) {
                    console.error(`[${config.pkg.name}] Error reset limit harian:`, error);
                    
                    // Kirim pesan error ke grup dengan JID manual
                    const errorMessage = quote(
                        `⚠️ Error Reset Limit Harian\n\n` +
                        `📅 Waktu: ${new Date().toLocaleString()}\n` +
                        `❌ Error: ${error.message}\n\n` +
                        `🔄 Mencoba lagi dalam 1 menit...`
                    );
                    
                    // Kirim pesan error ke grup log
                    await bot.core.sendMessage(config.bot.logGroupJid, {
                        text: errorMessage
                    });
                    
                    // Coba lagi dalam 1 menit jika terjadi error
                    setTimeout(resetDailyLimit, 60000);
                }
            }, timeUntilMidnight);

            // Log informasi waktu reset berikutnya
            const nextResetTime = new Date(now.getTime() + timeUntilMidnight);
            console.log(`[${config.pkg.name}] Reset limit harian selanjutnya pada: ${nextResetTime.toLocaleString()}`);
        }

        // Mulai penghitung waktu untuk reset limit harian
        resetDailyLimit();

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
                    
                    const { data } = await axios.get(apiUrl, {
                        headers: {
                            "x-api-key": tools.api.listUrl().agatz.APIKey
                        }
                    });
                    
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
                                const groupDb = await db.get(`group.${groupId.split('@')[0]}.option`) || {};
                                if (groupDb.shalat) {
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
        const userDb = await db.get(`user.${senderId}`) || {};
        const isOwner = tools.general.isOwner(senderId);
        const isPremium = userDb?.premium;

        // Penanganan pada mode bot
        const botMode = await db.get("bot.mode") || "public";
        if (isPrivate && botMode === "group") return;
        if (isGroup && botMode === "private") return;
        if (!isOwner && botMode === "self") return;

        // Log pesan masuk
        const currentTime = new Date();
        const timeString = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`;
        
        if (isGroup) {
            console.log(`[${config.pkg.name}] [${timeString}] Pesan masuk dari grup: ${groupId}, oleh: ${senderId}`);
        } else {
            console.log(`[${config.pkg.name}] [${timeString}] Pesan masuk dari: ${senderId}`);
        }

        // Penanganan pesan sapaan
        if (m.content) {
            // Mengabaikan pesan dari diri sendiri
            if (senderJid === config.bot.jid) return;
            
            const autoMessageHeader = quote("*[🤖 Pesan Otomatis]*") + "\n";
            
            // Penanganan variasi pesan "Woy" dan "Wai Woi"
            if (/^(woy|woi|woyyy|woii|wai|wai woi)$/i.test(m.content.trim())) {
                const randomResponses = [
                    "👋 Woy! Ada yang bisa bantu? Cek .menu ya buat lihat fitur bot~",
                    "😄 Woi! Semangat terus! Jangan lupa ketik .menu buat lihat fitur-fitur seru.",
                    "🤔 Woyyy? Ada yang mau ditanyain? Ketik .menu biar tahu lebih banyak tentang bot ini!",
                    "🙌 Woii! Gimana kabarnya? Jangan lupa cek .menu buat fitur-fitur bot.",
                    "😎 Woy! Siap bantu! Ketik .menu buat lihat semua fitur yang ada.",
                    "😠 Wai woi, sopan dikit dong! Ketik .menu ya buat lihat fitur bot~",
                    "🎉 Woy! Lagi ngapain nih? Cek .menu buat fitur seru dari bot ini!",
                    "😜 Woi! Gimana kabarnya? Jangan lupa ketik .menu buat lihat fitur-fitur keren!"
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }
            
            // Penanganan pesan "P"
            if (/^[pP]$/i.test(m.content.trim())) {
                const randomResponses = [
                    "🙄 P P P... Salam yang lebih sopan dong, kak! Ketik .menu ya buat lihat fitur bot~",
                    "😤 Ih, ga sopan! Salam dulu dong, kakak...\n\nOh iya, ketik .menu untuk lihat fitur bot ya!",
                    "🤨 P doang? Minimal 'Permisi' gitu...\n\nBtw, ketik .menu untuk lihat semua fitur bot, ya!",
                    "😑 Kakak kalau ketuk pintu juga ga cuma 'tok' doang kan?\n\nKalau mau lihat fitur bot, ketik .menu ya~",
                    "🧐 Hmm... kurang sopan nih. Assalamualaikum dulu dong~\n\nKetik .menu untuk melihat fitur-fitur bot, ya!"
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }
            
            // Penanganan salam Islam
            if (/^(as+a?la+m|as+a?la+mu+a?la+i+ku+m|as+a?la+mu+a?la+i+ku+m\s+wr\.?\s*wb?\.?)/i.test(m.content.trim())) {
                const randomResponses = [
                    "Waalaikumussalam! ✨ Semoga harimu menyenangkan! Cek .menu untuk fitur-fitur bot ya~",
                    "Waalaikumussalam wr.wb. 🌟 Semoga hari kakak menyenangkan! Cek .menu untuk lihat fitur bot.",
                    "Waalaikumussalam! 🤗 Ada yang bisa dibantu? Ketik .menu untuk lihat fitur bot.",
                    "Waalaikumussalam wr.wb. 💫 Alhamdulillah ada yang salam~ Cek .menu untuk fitur bot, ya!",
                    "Waalaikumussalam! 🌺 MasyaAllah sopan sekali~ Cek .menu ya kak untuk lihat fitur bot."
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }

            // Penanganan salam Kristen/Katolik
            if (/^(shalom|shal+om|tuhan memberkati|puji tuhan|haleluya|praise the lord|god bless)/i.test(m.content.trim())) {
                const randomResponses = [
                    "✝️ Shalom! Tuhan Yesus memberkati! Cek .menu untuk lihat fitur-fitur bot ya~",
                    "✝️ Amin, Tuhan memberkati! Semoga harimu penuh berkat! Cek .menu untuk lihat fitur bot.",
                    "✝️ Shalom! Damai Kristus menyertai! Ketik .menu untuk lihat apa yang bisa bot bantu.",
                    "✝️ Puji Tuhan! Selamat datang! Coba ketik .menu untuk lihat fitur bot ya.",
                    "✝️ God bless you! Tuhan memberkati! Ketik .menu untuk lihat fitur-fitur bot."
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }

            // Penanganan salam Buddha
            if (/^(namo buddhaya|namo budaya|sadhu|namaste)/i.test(m.content.trim())) {
                const randomResponses = [
                    "🙏 Namo Buddhaya! Cek .menu untuk lihat fitur-fitur bot ya~",
                    "🙏 Sadhu! Semoga kakak selalu dalam lindungan Triratna! Cek .menu untuk lihat fitur bot.",
                    "🙏 Namo Buddhaya! Semoga damai menyertai! Ketik .menu untuk lihat fitur bot.",
                    "🙏 Namaste! Selamat datang! Coba ketik .menu untuk lihat fitur-fitur bot.",
                    "🙏 Namo Buddhaya! Semoga berkah menyertai! Ketik .menu untuk lihat fitur bot ya."
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }

            // Penanganan salam Hindu
            if (/^(om swastiastu|om santi|namaste)/i.test(m.content.trim())) {
                const randomResponses = [
                    "🕉️ Om Swastiastu! Cek .menu untuk lihat fitur-fitur bot ya~",
                    "🕉️ Om Santi Santi Santi Om! Cek .menu untuk lihat fitur bot.",
                    "🕉️ Namaste! Semoga Hyang Widhi memberkati! Ketik .menu untuk lihat fitur bot.",
                    "🕉️ Om Swastiastu! Selamat datang! Coba ketik .menu untuk lihat fitur-fitur bot.",
                    "🕉️ Om Santi! Semoga damai menyertai! Ketik .menu untuk lihat fitur bot ya."
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }

            // Penanganan permisi
            if (/^(per?misi|per?mis|numpang|permici)/i.test(m.content.trim())) {
                const randomResponses = [
                    "👋 Iya kak, silahkan... Cek .menu untuk lihat fitur bot ya~",
                    "🌸 Ya, monggo kak~ Cek .menu untuk lihat fitur-fitur bot.",
                    "✨ Iya, silahkan kak. Ketik .menu untuk lihat apa saja yang bisa bot bantu.",
                    "🤗 Hai kak! Sopan banget... Coba ketik .menu untuk lihat fitur bot.",
                    "💫 Iya kak, silahkan masuk~ Ketik .menu ya untuk lihat fitur bot."
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }

            // Penanganan halo/hai
            if (/^(h[ae][ll]?[ou]+|ha+i+|he+y+|hi+)(?![a-zA-Z])/i.test(m.content.trim())) {
                const randomResponses = [
                    "👋 Hai juga kak! Cek .menu untuk lihat fitur bot ya~",
                    "🌟 Halo kak~ Cek .menu untuk lihat fitur-fitur bot.",
                    "✨ Hey hey~ Ketik .menu untuk lihat apa yang bisa bot bantu.",
                    "🤗 Haiii! Ketik .menu ya kak untuk lihat fitur bot.",
                    "💫 Halo kak! Coba ketik .menu untuk lihat fitur bot~",
                    "🌸 Hi! Ketik .menu untuk lihat fitur-fitur bot ya.",
                    "😊 Heyy! Cek .menu untuk lihat fitur bot kak."
                ];
                const response = autoMessageHeader + randomResponses[Math.floor(Math.random() * randomResponses.length)];
                await ctx.reply(response);
                return;
            }
        }

        // Grup atau Pribadi
        if (isGroup || isPrivate) {
            
            // Penangan pada ukuran basis data
            config.bot.dbSize = fs.existsSync("database.json") ? tools.general.formatSize(fs.statSync("database.json").size / 1024) : "N/A";

            // Penanganan basis data pengguna
            const {
                coin,
                limit,
                level,
                ...otherUserDb
            } = userDb || {};

            const newUserDb = {
                coin: (isOwner || isPremium) ? 0 : (userDb?.coin ?? 1000),
                limit: (isOwner || isPremium) ? 0 : (userDb?.limit ?? 10),
                level: userDb?.level || 0,
                uid: userDb?.uid || tools.general.generateUID(senderId),
                xp: userDb?.xp || 0,
                ...otherUserDb
            };
            await db.set(`user.${senderId}`, newUserDb);

            // Penanganan untuk perintah
            const isCmd = tools.general.isCmd(m.content, ctx._config);
            if (isCmd) {
                if (config.system.autoTypingOnCmd) await ctx.simulateTyping(); // Simulasi pengetikan otomatis untuk perintah

                // Did you mean?
                const mean = isCmd.didyoumean;
                const prefix = isCmd.prefix;
                const input = isCmd.input;

                if (mean) await ctx.reply(quote(`❎ Kamu salah ketik, kayaknya ${monospace(prefix + mean)} deh.`));

                // Penanganan XP & Level untuk pengguna
                const xpGain = 10;
                let xpToLevelUp = 100;

                let newUserXp = userDb?.xp + xpGain;

                if (newUserXp >= xpToLevelUp) {
                    let newUserLevel = userDb?.level + 1;
                    newUserXp -= xpToLevelUp;

                    xpToLevelUp = Math.floor(xpToLevelUp * 1.2);

                    const profilePictureUrl = await ctx._client.profilePictureUrl(senderJid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                    if (userDb?.autolevelup) await ctx.reply({
                        text: `${quote(`Selamat! Kamu telah naik ke level ${newUserLevel}!`)}\n` +
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

                    await Promise.all([
                        db.set(`user.${senderId}.xp`, newUserXp),
                        db.set(`user.${senderId}.level`, newUserLevel)
                    ]);
                } else {
                    await db.set(`user.${senderId}.xp`, newUserXp);
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
                        console.error(`[${config.pkg.name}] Error:`, error);
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
                        console.error(`[${config.pkg.name}] Error:`, error);
                        await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
                    }
                }
            }

            // Penanganan AFK: Pengguna yang disebutkan
            const mentionJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionJids && mentionJids.length > 0) {
                for (const mentionJid of mentionJids) {
                    const userAFK = await db.get(`user.${mentionJid}.afk`) || {};

                    if (userAFK && userAFK.reason && userAFK.timestamp) {
                        const timeago = tools.general.convertMsToDuration(Date.now() - userAFK.timestamp);
                        await ctx.reply(quote(`💤 Dia sedang AFK ${userAFK.reason ? `dengan alasan "${userAFK.reason}"` : "tanpa alasan"} selama ${timeago}.`));
                    }
                }
            }

            const userAFK = await db.get(`user.${senderId}.afk`) || {};

            if (userAFK && userAFK.reason && userAFK.timestamp) {
                const currentTime = Date.now();
                const timeElapsed = currentTime - userAFK.timestamp;

                if (timeElapsed > 3000) {
                    const timeago = tools.general.convertMsToDuration(timeElapsed);
                    await ctx.reply(quote(`💤 Kamu telah keluar dari AFK ${userAFK.reason ? `dengan alasan "${userAFK.reason}"` : "tanpa alasan"} selama ${timeago}.`));
                    await db.delete(`user.${senderId}.afk`);
                }
            }
        }

        // Grup
        if (isGroup) {
            if (m.key.fromMe) return;

            const groupDb = await db.get(`group.${groupId}`) || {};

            // Penanganan antilink
            if (groupDb?.option?.antilink) {
                const isUrl = await tools.general.isUrl(m.content);
                if (m.content && await tools.general.isUrl(m.content) && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                    await ctx.reply(quote(`⛔ Jangan kirim tautan!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.option?.autokick) {
                        await ctx.group().kick([senderJid]);
                        // Kirim pesan peringatan ke pesan pribadi
                        await ctx._client.sendMessage(senderJid, {
                            text: quote(`⚠️ Kamu dikick dari grup karena mengirim tautan.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                        });
                    }
                }
            }

            // Penanganan antinsfw
            if (groupDb?.option?.antinsfw) {
                const msgType = ctx.getMessageType();
                const checkMedia = await tools.general.checkMedia(msgType, "image");

                if (checkMedia && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                    const buffer = await ctx.msg.media.toBuffer();
                    const uploadUrl = await tools.general.upload(buffer);

                    const apiUrl = tools.api.createUrl("fasturl", "/tool/imagechecker", {
                        url: uploadUrl
                    });
                    const {
                        data
                    } = await axios.get(apiUrl, {
                        headers: {
                            "x-api-key": tools.api.listUrl().fasturl.APIKey
                        }
                    });

                    if (data.results.status === "NSFW") {
                        await ctx.reply(`⛔ Jangan kirim NSFW!`);
                        await ctx.deleteMessage(m.key);
                        if (!config.system.restrict && groupDb?.option?.autokick) {
                            await ctx.group().kick([senderJid]);
                            // Kirim pesan peringatan ke pesan pribadi
                            await ctx._client.sendMessage(senderJid, {
                                text: quote(`⚠️ Kamu dikick dari grup karena mengirim NFSW.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                            });
                        }
                    }
                }
            }

            // Penanganan antisticker
            if (groupDb?.option?.antisticker) {
                const msgType = ctx.getMessageType();
                const checkMedia = await tools.general.checkMedia(msgType, "sticker");

                if (checkMedia && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                    await ctx.reply(`⛔ Jangan kirim stiker!`);
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.option?.autokick) {
                        await ctx.group().kick([senderJid]);
                        // Kirim pesan peringatan ke pesan pribadi
                        await ctx._client.sendMessage(senderJid, {
                            text: quote(`⚠️ Kamu dikick dari grup karena mengirim sticker.\n\n> Jika ini adalah kesalahan segera hubungi owner/admin.`)
                        });
                    }
                }
            }

            // Penanganan antitoxic
            const toxicRegex = /anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol/i;
            if (groupDb?.option?.antitoxic) {
                if (m.content && toxicRegex.test(m.content) && !await tools.general.isAdmin(ctx.group(), senderJid)) {
                    await ctx.reply(quote(`⛔ Jangan toxic!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.option?.autokick) {
                        await ctx.group().kick([senderJid]);
                        // Kirim pesan peringatan ke pesan pribadi
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
            const allMenfessDb = await db.get("menfess") || {};
            if ((!isCmd || isCmd.didyoumean) && allMenfessDb && typeof allMenfessDb === "object" && Object.keys(allMenfessDb).length > 0) {
                const menfessEntries = Object.entries(allMenfessDb);

                for (const [conversationId, menfessData] of menfessEntries) {
                    const {
                        from,
                        to
                    } = menfessData;
                    const senderInConversation = senderId === from || senderId === to;

                    if (m.content && /^\b(delete|stop)\b$/i.test(m.content.trim()) && senderInConversation) {
                        const targetId = senderId === from ? to : from;
                        const message = "✅ Pesan sudah diakhiri!";

                        await ctx.reply(quote(message));
                        await ctx.sendMessage(`${targetId}@s.whatsapp.net`, {
                            text: quote(message)
                        });
                        await db.delete(`menfess.${conversationId}`);
                        break;
                    }

                    if (senderInConversation) {
                        const targetId = senderId === from ? `${to}@s.whatsapp.net` : `${from}@s.whatsapp.net`;

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
    bot.ev.on(Events.UserJoin, async (m) => handleUserEvent(bot.core, m, "UserJoin"));
    bot.ev.on(Events.UserLeave, async (m) => handleUserEvent(bot.core, m, "UserLeave"));
};