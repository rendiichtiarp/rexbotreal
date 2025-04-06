const { quote } = require("@mengkodingan/ckptw");

module.exports = {
    name: "reportstats",
    aliases: ["statsreport", "reportstat"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            // Ambil statistik laporan
            const stats = await Database.getReportStats();

            // Format pesan
            let message = `${quote("STATISTIK LAPORAN")}\n\n` +
                `${quote(`Total Laporan: ${stats.total_reports}`)}\n` +
                `${quote(`Pending: ${stats.pending_reports}`)}\n` +
                `${quote(`Diproses: ${stats.processing_reports}`)}\n` +
                `${quote(`Selesai: ${stats.resolved_reports}`)}\n` +
             `${quote(`Ditolak: ${stats.rejected_reports}`)}\n`;
            
            if (stats.avg_resolution_time) {
                const avgHours = Math.round(stats.avg_resolution_time * 10) / 10;
                message += `${quote(`Rata-rata Waktu Penyelesaian: ${avgHours} jam`)}\n`;
            }

            return await ctx.reply(message);

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 