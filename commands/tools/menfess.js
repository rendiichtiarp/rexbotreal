const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "menfess",
    aliases: ["conf", "confes", "confess", "menf", "menfes"],
    category: "tools",
    handler: {
        coin: [10, "text", 1],
        private: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const [id, ...text] = ctx.args;
        const formattedId = id ? id.replace(/[^\d]/g, "") : null;
        const menfessText = text ? text.join(" ") : null;

        const senderId = ctx.sender.jid.split(/[:@]/)[0];

        if (!formattedId && !menfessText) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.msg.generateCommandExample(ctx._used.prefix + ctx._used.command, `${senderId} halo dunia!`))}\n` +
            quote(tools.msg.generateNotes(["Jangan gunakan spasi pada angka. Contoh: +62 8123-4567-8910, seharusnya +628123-4567-8910"]))
        );

        const allMenfessDb = await db.get("menfess") || {};
        const isSenderInMenfess = Object.values(allMenfessDb).some(m => m.from === senderId || m.to === senderId);
        const isReceiverInMenfess = Object.values(allMenfessDb).some(m => m.from === formattedId || m.to === formattedId);

        if (isSenderInMenfess) return await ctx.reply(quote(`❎ Kamu sudah terlibat dalam percakapan lain. Pastikan kamu sudah mengakhiri percakapan sebelumnya.`));
        if (isReceiverInMenfess) return await ctx.reply(quote(`❎ Pengguna ini sudah terlibat dalam percakapan lain. Coba lagi nanti.`));

        try {
            if (formattedId === senderId) return await ctx.reply(quote(`❎ Tidak dapat digunakan pada diri Kamu sendiri.`));

            /*const fakeText = {
                key: {
                    fromMe: false,
                    participant: "13135550002@s.whatsapp.net",
                    remoteJid: "status@broadcast"
                },
                message: {
                    extendedTextMessage: {
                        text: "Seseorang telah mengirimimu pesan menfess.",
                        title: config.bot.name,
                        thumbnailUrl: config.bot.thumbnail
                    }
                }
            };*/

            // Kirim pesan pemberitahuan ke penerima menfess
            await ctx._client.sendMessage(`${formattedId}@s.whatsapp.net`, {
                text: `${(`👋 Halo aku adalah ${config.bot.name}, seseorang mengirimimu pesan melaluiku.\n\n> Pesan dibawah ini adalah pesan dari seseorang yang diteruskan kepadamu.`)}`,
                title: config.bot.name,
                thumbnailUrl: config.bot.thumbnail,
                contextInfo: {
                    externalAdReply: {
                        mediaType: 1,
                        previewType: 0,
                        mediaUrl: config.bot.website,
                        title: config.bot.name,
                        body: null,
                        renderLargerThumbnail: true,
                        thumbnailUrl: config.bot.thumbnail,
                        sourceUrl: config.bot.website
                    }
                }
            });

            await ctx.sendMessage(`${formattedId}@s.whatsapp.net`, {
                text: `${menfessText}\n` +
                    `${config.msg.readmore}\n` +
                    quote("Pesan yang Kamu kirim disini akan diteruskan ke orang tersebut. Jika ingin berhenti, cukup ketik ```delete``` atau ```stop``` .")
            }, {
                /*quoted: fakeText*/
            });

            await db.set(`menfess.${Date.now()}`, {
                from: senderId,
                to: formattedId
            });

            return await ctx.reply(quote("✅ Kirim pesan kamu disini. Pesan yang Anda kirim disini akan diteruskan ke orang tersebut.\n\nJika ingin berhenti, cukup ketik ```delete``` atau ```stop``` ."));
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};