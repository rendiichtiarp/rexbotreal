const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "menfess",
    aliases: ["conf", "confes", "confess", "menf", "menfes"],
    category: "tool",
    permissions: {
        coin: 5,
        private: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ");
        // Ubah regex untuk memisahkan nomor dan pesan opsional
        const match = input.match(/^(\d+)(?:\s+(.+))?/);
        
        if (!match) {
            return await ctx.reply(
                `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.cmd.generateCommandExample(ctx.used, "628123456789 halo, dunia!"))}\n` +
                quote(tools.cmd.generateNotes(["Jangan gunakan spasi pada angka. Contoh: +62 8123-4567-8910, seharusnya +628123-4567-8910"]))
            );
        }

        const formattedId = match[1].replace(/[^\d]/g, "");
        const menfessText = match[2]?.trim();
        const senderId = tools.general.getID(ctx.sender.jid);

        try {
            if (formattedId === senderId) return await ctx.reply(quote(`❎ Tidak dapat digunakan pada diri Anda sendiri.`));

            // Cek apakah pengirim atau penerima sedang dalam percakapan aktif
            const activeMenfess = await Database.getActiveMenfess();
            
            const senderActiveMenfess = activeMenfess.find(m => 
                m.from_user === senderId || m.to_user === senderId
            );
            
            const receiverActiveMenfess = activeMenfess.find(m => 
                m.from_user === formattedId || m.to_user === formattedId
            );

            // Cek apakah sudah ada menfess aktif dengan nomor yang sama
            const existingMenfess = activeMenfess.find(m => 
                (m.from_user === senderId && m.to_user === formattedId) || 
                (m.from_user === formattedId && m.to_user === senderId)
            );

            if (existingMenfess) {
                return await ctx.reply(quote(`❎ Anda sudah memiliki percakapan menfess dengan nomor tersebut, tidak perlu membuat lagi.`));
            }

            if (senderActiveMenfess) {
                return await ctx.reply(quote("❎ Anda masih memiliki percakapan menfess yang aktif. Ketik `delete` atau `stop` untuk mengakhiri."));
            }

            if (receiverActiveMenfess) {
                return await ctx.reply(quote(`❎ Pengguna ini masih memiliki percakapan menfess yang aktif. Coba lagi nanti.`));
            }

            await ctx.sendMessage(`${formattedId}@s.whatsapp.net`, {
                text: menfessText ? 
                    `Hai Saya RexbotX, ada seseorang mengirimkan pesan kepada Anda melalui Saya.\n\nPesan:\n${menfessText}\n${config.msg.readmore}\n${quote("Pesan yang Anda kirim akan diteruskan ke orang tersebut. Jika ingin berhenti, cukup ketik 'delete' atau 'stop'.")}` :
                    quote("Hai Saya RexbotX, ada seseorang mengirimkan pesan kepada Anda melalui Saya. Pesan yang Anda kirim akan diteruskan ke orang tersebut. Jika ingin berhenti, cukup ketik 'delete' atau 'stop'."),
                contextInfo: {
                    externalAdReply: {
                        title: config.msg.watermark,
                        mediaType: "IMAGE",
                        thumbnailUrl: config.bot.thumbnail,
                        sourceUrl: config.bot.website,
                        renderLargerThumbnail: true
                    }
                }
            });

            // Simpan data menfess ke database
            await Database.createMenfess({
                from_user: senderId,
                to_user: formattedId
            });

            return await ctx.reply(quote(menfessText 
                ? "✅ Pesan berhasil terkirim! Pesan yang Anda kirim akan diteruskan ke orang tersebut."
                : "✅ Percakapan menfess telah dimulai! Silakan kirimkan pesan Anda.") + 
                " Jika ingin berhenti, cukup ketik `delete` atau `stop`."
            );
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};