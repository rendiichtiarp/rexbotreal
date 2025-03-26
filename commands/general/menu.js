const {
    bold,
    italic,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

// Fungsi untuk mendapatkan salam berdasarkan waktu
function getGreeting() {
    const hour = moment.tz(config.system.timeZone).hour();
    if (hour >= 4 && hour < 10) return "🌅 Selamat Pagi";
    if (hour >= 10 && hour < 14) return "☀️ Selamat Siang";
    if (hour >= 14 && hour < 18.5) return "🌇 Selamat Sore";
    return "🌙 Selamat Malam";
}

module.exports = {
    name: "menu",
    aliases: ["help", "list", "listmenu", "allmenu"],
    category: "general",
    permissions: {},
    code: async (ctx) => {
        try {
            const { cmd } = ctx.bot;
            const tag = {
                "ai-chat": "🤖 Artificial Intelligence (Chat)",
                "ai-image": "🎨 Artificial Intelligence (Image)",
                "ai-misc": "🎯 Artificial Intelligence (Misc)",
                "converter": "🔄 Media Converter",
                "downloader": "📥 Content Downloader",
                "entertainment": "🎮 Entertainment",
                "game": "🎲 Games",
                "minigames": "🎲 MiniGames",
                "group": "👥 Group Management",
                "maker": "🎨 Content Creator",
                "profile": "👤 User Profile",
                "search": "🔍 Information Search",
                "tool": "🛠️ Utilities",
                "owner": "👑 Bot Owner",
                "information": "ℹ️ Bot Information",
                "misc": "📦 Miscellaneous"
            };

            const senderId = tools.general.getID(ctx.sender.jid);
            const userDb = await Database.getUser(senderId);

            // Cek jika menggunakan allmenu
            const isAllMenu = ctx.used.command === 'allmenu';
            let categoryInput = isAllMenu ? null : ctx.used.command === 'menu' ? ctx.args[0]?.toLowerCase() : ctx.used.command;

            const header = [
                `${getGreeting()}, ${userDb?.name || "Pengguna"}!`,
                ``,
                `📅 *Tanggal:* ${moment.tz(config.system.timeZone).locale("id").format("dddd, DD MMMM YYYY")}`,
                `⏰ *Waktu:* ${moment.tz(config.system.timeZone).format("HH:mm")} WIB`,
                `⌛ *Uptime:* ${tools.general.convertMsToDuration(Date.now() - config.bot.readyAt)}`,
                ``,
                `📊 *Statistik Bot*`,
                `◦ Total Perintah: ${Array.from(cmd.values()).length}`,
                `◦ Total Kategori: ${Object.keys(tag).length}`,
                ``
            ].join('\n');

            let text = header;

            if (isAllMenu) {
                text += `*DAFTAR SEMUA PERINTAH*\n\n`;
                
                for (const category of Object.keys(tag)) {
                    const categoryCommands = Array.from(cmd.values())
                        .filter(command => command.category === category)
                        .map(command => ({
                            name: command.name,
                            aliases: command.aliases,
                            permissions: command.permissions || {}
                        }));

                    if (categoryCommands.length > 0) {
                        text += `*${tag[category]}*\n`;
                        
                        categoryCommands.forEach(cmd => {
                            let permissionsText = "";
                            if (cmd.permissions.coin) permissionsText += "💰";
                            if (cmd.permissions.group) permissionsText += "👥";
                            if (cmd.permissions.owner) permissionsText += "👑";
                            if (cmd.permissions.premium) permissionsText += "⭐";
                            if (cmd.permissions.private) permissionsText += "👤";

                            text += `◦ \`${ctx.used.prefix}${cmd.name}\` ${permissionsText}\n`;
                        });
                        text += '\n';
                    }
                }

                text += `*Keterangan:*\n` +
                    `💰 = Memerlukan Koin\n` +
                    `👥 = Khusus Grup\n` +
                    `👑 = Khusus Owner\n` +
                    `⭐ = Khusus Premium\n` +
                    `👤 = Khusus Chat Pribadi\n`;

            } else if (categoryInput) {
                const normalizedInput = categoryInput.replace(/\s+/g, '');
                const searchKey = normalizedInput.replace(/(ai|chat|image|misc)/gi, (match) => {
                    if (match.toLowerCase() === 'chat') return 'ai-chat';
                    if (match.toLowerCase() === 'image') return 'ai-image';
                    if (match.toLowerCase() === 'misc') return 'ai-misc';
                    return match;
                });

                const categoryKey = Object.keys(tag).find(key => 
                    key === searchKey || 
                    key.replace('-', '') === searchKey || 
                    key.split('-')[1] === searchKey ||
                    key === `ai-${searchKey}`
                );

                if (!categoryKey) {
                    return await ctx.reply(quote(`❎ Kategori \`${categoryInput}\` tidak ditemukan!\n\nKetik \`${ctx.used.prefix}menu\` untuk melihat daftar kategori yang tersedia.`));
                }

                text += `*${tag[categoryKey]}*\n\n`;
                const categoryCommands = Array.from(cmd.values())
                    .filter(command => command.category === categoryKey)
                    .map(command => ({
                        name: command.name,
                        aliases: command.aliases,
                        permissions: command.permissions || {}
                    }));

                categoryCommands.forEach(cmd => {
                    let permissionsText = "";
                    if (cmd.permissions.coin) permissionsText += "💰";
                    if (cmd.permissions.group) permissionsText += "👥";
                    if (cmd.permissions.owner) permissionsText += "👑";
                    if (cmd.permissions.premium) permissionsText += "⭐";
                    if (cmd.permissions.private) permissionsText += "👤";

                    text += `◦ \`${ctx.used.prefix}${cmd.name}\` ${permissionsText}\n`;
                });

                text += `\n*Keterangan:*\n` +
                    `💰 = Memerlukan Koin\n` +
                    `👥 = Khusus Grup\n` +
                    `👑 = Khusus Owner\n` +
                    `⭐ = Khusus Premium\n` +
                    `👤 = Khusus Chat Pribadi\n`;

            } else {
                text += `*DAFTAR KATEGORI*\n` +
                    `Ketik \`${ctx.used.prefix}menu [kategori]\` untuk melihat daftar perintah pada kategori.\n` +
                    `Contoh: \`${ctx.used.prefix}menu chat\` untuk melihat menu AI Chat\n\n`;
                
                for (const category of Object.keys(tag)) {
                    const commandCount = Array.from(cmd.values())
                        .filter(command => command.category === category).length;
                    const displayCategory = category.replace('ai-', '');
                    
                    text += `◦ \`menu ${displayCategory}\` ${tag[category]}\n   ↳ ${commandCount} perintah\n`;
                }
            }

            text += `\n${config.msg.footer}`;

            return await ctx.reply({
                text,
                contextInfo: {
                    mentionedJid: [ctx.sender.jid],
                    externalAdReply: {
                        title: config.msg.watermark,
                        mediaType: "IMAGE",
                        thumbnailUrl: config.bot.thumbnail,
                        sourceUrl: config.bot.website,
                        renderLargerThumbnail: true
                    }
                },
                mentions: [ctx.sender.jid]
            });

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};