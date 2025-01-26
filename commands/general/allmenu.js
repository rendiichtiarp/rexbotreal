const {
    quote
} = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

function getTimeEmoji() {
    const hour = moment.tz(config.system.timeZone).hour();
    if (hour < 6) return "🌙"; // Malam
    if (hour < 12) return "🌅"; // Pagi
    if (hour < 18) return "☀️"; // Siang
    return "🌇"; // Sore
}

module.exports = {
    name: "allmenu",
    aliases: [],
    category: "general",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const { cmd } = ctx._config;
            const tag = {
                "ai-chat": "🤖 AI Chat",
                "ai-image": "🎨 AI Image",
                "converter": "🔄 Converter",
                "downloader": "📥 Downloader",
                "entertainment": "🎮 Entertainment",
                "game": "🎲 Game",
                "group": "👥 Group",
                "maker": "🎨 Maker",
                "profile": "👤 Profile",
                "search": "🔍 Search",
                "tool": "🛠️ Tool",
                "owner": "👑 Owner",
                "information": "ℹ️ Information",
            };

            const senderJid = ctx.sender.jid;
            const senderId = senderJid.split(/[:@]/)[0];
            const userDb = await db.get(`user.${senderId}`) || {};
            
            const openingText = `Hai ${userDb?.name || "Kak"}! ${getTimeEmoji()}\n\n` +
                `📅 ${moment.tz(config.system.timeZone).locale("id").format("dddd, DD MMMM YYYY")}\n` +
                `⏰ ${moment.tz(config.system.timeZone).format("HH:mm")} WIB\n` +
                `⌛ Runtime: ${tools.general.convertMsToDuration(Date.now() - config.bot.readyAt)}\n\n`;

            let text = openingText + `*Daftar Semua Kategori dan Perintah*\n\n`;

            // Hitung total perintah dan kategori
            const totalCommands = Array.from(cmd.values()).length;
            const totalCategories = Object.keys(tag).length;
            text += `Total Perintah: ${totalCommands}\n`;
            text += `Total Kategori: ${totalCategories}\n\n`;

            for (const category of Object.keys(tag)) {
                const commandsInCategory = Array.from(cmd.values())
                    .filter(command => command.category === category);
                
                text += `*${tag[category]}*\n`;
                commandsInCategory.forEach(command => {
                    let handlerText = "";
                    if (command.handler.coin) handlerText += "💰";
                    if (command.handler.group || command.handler.onlyGroup) handlerText += "👥";
                    if (command.handler.owner) handlerText += "👑";
                    if (command.handler.premium) handlerText += "⭐";
                    if (command.handler.private) handlerText += "👤";

                    text += `◦ \`${ctx._used.prefix}${command.name}\` ${handlerText}\n`;
                });
                text += `\n`;
            }

            text += `*Keterangan:*\n` +
                    `💰 = Butuh koin\n` +
                    `👥 = Khusus grup\n` +
                    `👑 = Khusus owner\n` +
                    `⭐ = Khusus premium\n` +
                    `👤 = Khusus private chat\n`;

            text += "\n" + config.msg.footer;

            return await ctx.reply({
                text,
                mentions: [ctx.sender.jid]
            });
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 