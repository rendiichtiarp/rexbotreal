const { quote } = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

module.exports = {
    name: "reportlist",
    aliases: ["listreport", "reports"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            // Parse filter status jika ada
            const status = ctx.args[0]?.toLowerCase();
            const validStatus = ['pending', 'process', 'done', 'rejected'];
            const filters = {};

            if (status && validStatus.includes(status)) {
                filters.status = status;
            }

            // Ambil daftar laporan
            const reports = await Database.getReports(filters);

            if (!reports.length) {
                return await ctx.reply(quote(`❎ Tidak ada laporan ${status ? `dengan status ${status}` : ''} yang ditemukan.`));
            }

            // Format pesan
            let message = `${quote("DAFTAR LAPORAN")}\n` +
                `${status ? `${quote(`Status: ${status}`)}\n` : ''}` +
                `${quote(`Total: ${reports.length} laporan`)}\n\n`;

            reports.forEach((report, index) => {
                const reportTime = moment(report.created_at).tz(config.system.timeZone).format("DD/MM/YY HH:mm");
                message += `${quote(`${index + 1}. ${report.report_code}`)}\n`;
                message += `${quote(`Dari: ${report.reporter_name || 'No Name'}`)}\n`;
                message += `${quote(`Nomor: ${report.user_id}`)}\n`;
                message += `${quote(`Status: ${report.status}`)}\n`;
                message += `${quote(`Waktu: ${reportTime}`)}\n`;
                message += `${quote(`Pesan: ${report.message}`)}\n`;
                if (report.admin_name) {
                    message += `${quote(`Ditangani: ${report.admin_name}`)}\n`;
                }
                message += `\n`;
            });

            return await ctx.reply(message);

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 