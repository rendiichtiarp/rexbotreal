const {
    bold,
    italic,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

// Tambahkan fungsi untuk menentukan emoji berdasarkan waktu
function getTimeEmoji() {
    const hour = moment.tz(config.system.timeZone).hour();
    if (hour < 6) return "🌙"; // Malam
    if (hour < 12) return "🌅"; // Pagi
    if (hour < 18) return "☀️"; // Siang
    return "🌇"; // Sore
}

module.exports = {
    name: "menu",
    aliases: ["help", "list", "listmenu"],
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

            let text = openingText + `*Jumlah Perintah dan Kategori*\n`;

            // Hitung total perintah dan kategori
            const totalCommands = Array.from(cmd.values()).length;
            const totalCategories = Object.keys(tag).length;
            text += `Total Perintah: ${totalCommands}\n`;
            text += `Total Kategori: ${totalCategories}\n\n`;

            const args = ctx.args[0]?.toLowerCase();

            // Jika ada argumen kategori
            if (args) {
                // Ubah format input user (hilangkan tanda "-")
                const normalizedInput = args.replace(/\s+/g, ''); // Hilangkan spasi
                const searchKey = normalizedInput.replace(/(ai|chat|image)/gi, (match) => {
                    // Handle kasus khusus untuk ai-chat dan ai-image
                    if (match.toLowerCase() === 'chat') return 'ai-chat';
                    if (match.toLowerCase() === 'image') return 'ai-image';
                    return match;
                });

                const categoryKey = Object.keys(tag).find(key => 
                    key === searchKey || // Exact match
                    key.replace('-', '') === searchKey || // Match tanpa tanda "-"
                    key.split('-')[1] === searchKey // Match dengan bagian setelah "-"
                );

                if (!categoryKey) {
                    return await ctx.reply(`❎ Kategori \`${args}\` tidak ditemukan!\n\nKetik \`${ctx._used.prefix}menu\` untuk melihat daftar kategori.`);
                }

                text = `*${tag[categoryKey]}*\n\n`;
                const categoryCommands = Array.from(cmd.values())
                    .filter(command => command.category === categoryKey)
                    .map(command => ({
                        name: command.name,
                        aliases: command.aliases,
                        usage: command.usage || `${ctx._used.prefix}${command.name}`,
                        handler: command.handler || {}
                    }));

                categoryCommands.forEach(cmd => {
                    let handlerText = "";
                    if (cmd.handler.coin) handlerText += "💰";
                    if (cmd.handler.group || cmd.handler.onlyGroup) handlerText += "👥";
                    if (cmd.handler.owner) handlerText += "👑";
                    if (cmd.handler.premium) handlerText += "⭐";
                    if (cmd.handler.private) handlerText += "👤";

                    text += `◦ \`${ctx._used.prefix}${cmd.name}\` ${handlerText}\n`;
                });

                text += `\n*Keterangan:*\n` +
                    `💰 = Butuh koin\n` +
                    `👥 = Khusus grup\n` +
                    `👑 = Khusus owner\n` +
                    `⭐ = Khusus premium\n` +
                    `👤 = Khusus private chat\n`;
            } 
            // Jika tidak ada argumen (tampilkan daftar kategori)
            else {
                text += `*Daftar Kategori*\n` +
                    `Ketik \`${ctx._used.prefix}menu [kategori]\` untuk melihat daftar perintah\n` +
                    `Contoh: \`${ctx._used.prefix}menu chat\` untuk melihat menu AI Chat\n\n`;
                
                for (const category of Object.keys(tag)) {
                    const commandCount = Array.from(cmd.values())
                        .filter(command => command.category === category).length;
                    const displayCategory = category.replace('ai-', '');
                    
                    text += `◦ \`${displayCategory}\` ${tag[category]} (${commandCount} perintah)\n`;
                }
            }

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