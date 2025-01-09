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
    aliases: ["allmenu", "help", "list", "listmenu"],
    category: "general",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const {
                cmd
            } = ctx._config;
            const tag = {
                "ai-chat": "AI (Chat)",
                "ai-image": "AI (Image)",
                "converter": "Converter",
                "downloader": "Downloader",
                "entertainment": "Entertainment",
                "game": "Game",
                "group": "Group",
                "maker": "Maker",
                "profile": "Profile",
                "search": "Search",
                "tool": "Tool",
                "owner": "Owner",
                "information": "Information",
                "misc": "Miscellaneous"
            };

            // Kirim pesan pembuka di awal
            const openingText = `Halo @${ctx.sender.jid.split(/[:@]/)[0]}! Berikut adalah daftar perintah yang tersedia untuk Kamu:\n` +
                "\n" +
                `${(`📅 Tanggal: ${moment.tz(config.system.timeZone).locale("id").format("dddd, DD MMMM YYYY")}`)}\n` +
                `${(`${getTimeEmoji()} Waktu: ${moment.tz(config.system.timeZone).format("HH.mm.ss")}`)}\n` +
                `${(` 🚀 Uptime: ${tools.general.convertMsToDuration(Date.now() - config.bot.readyAt)}`)}\n` +
                "\n" +
                `${italic("Donasi bot ini agar bisa tetap online!")}`;

            await ctx.sendMessage(ctx.id, {
                text: openingText,
                contextInfo: {
                    mentionedJid: [ctx.sender.jid],
                    externalAdReply: {
                        mediaType: 1,
                        previewType: 0,
                        mediaUrl: config.bot.website,
                        title: config.msg.watermark,
                        body: null,
                        renderLargerThumbnail: true,
                        thumbnailUrl: config.bot.thumbnail,
                        sourceUrl: config.bot.website
                    },
                    /*forwardingScore: 9999,
                    isForwarded: true*/
                },
                mentions: [ctx.sender.jid]
            });
            
            let text = "Gunakan awalan perintah dengan simbol " + ctx._used.prefix + " Contoh: " + ctx._used.prefix + ctx._used.command +"\n";

            const symbolLegend = monospace`Keterangan:\nⓒ = Menggunakan coin\nⒼ = Hanya dalam grup\nⓄ = Hanya untuk owner\nⓅ = Hanya untuk pengguna premium\nⓟ = Hanya dalam private chat\n`;

            for (const category of Object.keys(tag)) {
                const categoryCommands = Array.from(cmd.values())
                    .filter(command => command.category === category)
                    .map(command => ({
                        name: command.name,
                        aliases: command.aliases,
                        handler: command.handler || {}
                    }));

                if (categoryCommands.length > 0) {
                    text += `\n ● ${bold(tag[category])}\n`;

                    categoryCommands.forEach(cmd => {
                        let handlerText = "";
                        if (cmd.handler.coin) handlerText += "ⓒ";
                        if (cmd.handler.group) handlerText += "Ⓖ";
                        if (cmd.handler.onlyGroup) handlerText += "Ⓖ";
                        if (cmd.handler.owner) handlerText += "Ⓞ";
                        if (cmd.handler.premium) handlerText += "Ⓟ";
                        if (cmd.handler.private) handlerText += "ⓟ";

                        text += monospace(`• ${ctx._used.prefix + cmd.name} ${handlerText}`);
                        text += "\n";
                    });

                    
                }
            }

            text += symbolLegend;
            text += "\n";
            text += config.msg.footer;

            /*const fakeText = {
                key: {
                    fromMe: true,
                    participant: "13135550002@s.whatsapp.net",
                    remoteJid: "status@broadcast"
                },
                message: {
                    extendedTextMessage: {
                        text: "“Lorem ipsum dolor sit amet, tenebris in umbra, vitae ad mortem.”",
                        title: config.bot.name
                    }
                }
            };*/

            return await ctx.sendMessage(ctx.id, {
                text,
                mentions: [ctx.sender.jid]
            }/*, {
                quoted: fakeText
            }*/);
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};