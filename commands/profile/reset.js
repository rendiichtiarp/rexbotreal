const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "reset",
    category: "profile",
    permissions: {
        private: true
    },
    code: async (ctx) => {
        await ctx.reply(quote("🤖 Apakah Anda yakin ingin mereset data Anda? Langkah ini akan menghapus seluruh data yang tersimpan dan tidak dapat dikembalikan. Ketik 'y' untuk melanjutkan atau 'n' untuk membatalkan."));

        try {
            const collector = ctx.MessageCollector({
                time: 60000
            });

            collector.on("collect", async (m) => {
                const userAnswer = m.content.trim().toLowerCase();
                const senderId = tools.general.getID(ctx.sender.jid);

                if (userAnswer === "y") {
                    try {
                        // Hapus data user dari database
                        await Database.deleteUser(senderId);
                        
                        // Buat data baru dengan nilai default
                        await Database.updateUser(senderId, {
                            coin: 200,
                            level: 1,
                            xp: 0,
                            premium: false,
                            banned: false,
                            autolevelup: true,
                            win_game: 0,
                            registered: false
                        });

                        await ctx.reply(quote("✅ Data Anda berhasil direset ke pengaturan awal!"));
                        collector.stop();
                    } catch (error) {
                        consolefy.error(`Error saat reset data:`, error);
                        await ctx.reply(quote(`❎ Gagal mereset data: ${error.message}`));
                        collector.stop();
                    }
                } else if (userAnswer === "n") {
                    await ctx.reply(quote("❎ Proses reset data telah dibatalkan."));
                    collector.stop();
                }
            });

            collector.on("end", async () => {});
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};