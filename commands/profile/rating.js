const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "rating",
    aliases: ["rate"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "5 RexBotX sangat membantu!")) +
            `\n\n${(tools.cmd.generateNotes([
                "Rating harus berupa angka 1-5",
                "Pesan setelah rating bersifat opsional"
            ]))}`
        );

        try {
            // Validasi rating
            const rating = parseInt(ctx.args[0]);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return await ctx.reply(quote(`❎ Rating harus berupa angka 1-5!`));
            }

            // Ambil pesan jika ada
            const message = ctx.args.slice(1).join(' ') || null;

            // Simpan rating ke database
            await Database.setRating(tools.general.getID(ctx.sender.jid), rating, message);

            // Buat pesan bintang
            const stars = '⭐'.repeat(rating);

            // Kirim pesan konfirmasi
            return await ctx.reply(
                `${quote(`✅ Terima kasih atas penilaiannya!`)}\n` +
                `${quote(`Rating: ${stars}`)}\n` +
                `${quote(`Pesan: ${message || '-'}`)}\n\n` +
                config.msg.footer
            );

        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
}
