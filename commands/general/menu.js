const {
    bold,
    italic,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");
const mime = require("mime-types");

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
                "ai-chat": "🤖 AI Chat",
                "ai-image": "🎨 AI Image",
                "ai-misc": "🎯 AI Misc",
                "converter": "🔄 Converter",
                "downloader": "📥 Downloader",
                "entertainment": "🎮 Entertainment",
                "game": "🎲 Games",
                "minigames": "🎲 MiniGames",
                "group": "👥 Group",
                "maker": "🎨 Maker",
                "profile": "👤 Profile",
                "search": "🔍 Search",
                "tool": "🛠️ Tools",
                "owner": "👑 Owner",
                "information": "ℹ️ Info",
                "misc": "📦 Misc"
            };

            const senderId = tools.general.getID(ctx.sender.jid);
            const userDb = await Database.getUser(senderId);

            // Cek jika menggunakan allmenu
            const isAllMenu = ctx.used.command === 'allmenu';
            let categoryInput = isAllMenu ? null : ctx.used.command === 'menu' ? ctx.args[0]?.toLowerCase() : ctx.used.command;

            const header = [
                `${getGreeting()}, ${userDb?.name || "Pengguna"}! ✨`,
                ``,
                `📊 *Info Bot*`,
                `⌛ Runtime: ${tools.general.convertMsToDuration(Date.now() - config.bot.readyAt)}`,
                `📝 Total CMD: ${Array.from(cmd.values()).length}\n`,
                ``
            ].join('\n');

            let text = header;

            if (isAllMenu) {
                text += `*DAFTAR PERINTAH*\n\n`;
                
                for (const category of Object.keys(tag)) {
                    const categoryCommands = Array.from(cmd.values())
                        .filter(command => command.category === category)
                        .map(command => ({
                            name: command.name,
                            permissions: command.permissions || {}
                        }));

                    if (categoryCommands.length > 0) {
                        text += `${tag[category]}\n`;
                        
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

                text += `*Note:*\n` +
                    `💰 Butuh Koin • 👥 Grup • 👑 Owner\n` +
                    `⭐ Premium • 👤 Private Chat\n`;

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
                    return await ctx.reply(quote(`❎ Kategori \`${categoryInput}\` tidak ditemukan!\n\nKetik \`${ctx.used.prefix}menu\` untuk melihat daftar kategori.`));
                }

                text += `*${tag[categoryKey]}*\n\n`;
                const categoryCommands = Array.from(cmd.values())
                    .filter(command => command.category === categoryKey)
                    .map(command => ({
                        name: command.name,
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

                text += `\n*Note:*\n` +
                    `💰 Butuh Koin • 👥 Grup • 👑 Owner\n` +
                    `⭐ Premium • 👤 Private Chat\n`;

            } else {
                text += `*KATEGORI MENU*\n` +
                    `Ketik ${ctx.used.prefix}menu [kategori]\n` +
                    `Contoh: ${ctx.used.prefix}menu chat\n\n`;
                
                for (const category of Object.keys(tag)) {
                    const commandCount = Array.from(cmd.values())
                        .filter(command => command.category === category).length;
                    const displayCategory = category.replace('ai-', '');
                    const example = displayCategory.toLowerCase();
                    
                    text += `◦ ${tag[category]} (${commandCount}) \`${ctx.used.prefix}menu ${example}\`\n`;
                }

                text += `\nKetik ${ctx.used.prefix}allmenu untuk melihat semua perintah`;
            }

            text += `\n\n${config.msg.footer}`;

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
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
