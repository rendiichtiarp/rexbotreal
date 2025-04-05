const { quote, monospace } = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

module.exports = {
    name: "myreport",
    aliases: ["myreports", "laporanku"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        try {
            const userId = tools.general.getID(ctx.sender.jid);
            
            // Ambil laporan user
            const reports = await Database.getReports({ userId });

            if (!reports.length) {
                return await ctx.reply(
                    `${quote(`❎ Anda belum memiliki riwayat laporan.`)}\n` +
                    quote(tools.cmd.generateNotes([`Untuk membuat laporan, gunakan ${monospace(`${ctx.used.prefix}report`)}`]))
                );
            }

            // Format pesan
            let message = `${quote("RIWAYAT LAPORAN ANDA")}\n`;
            message += `${quote(`Total: ${reports.length} laporan`)}\n\n`;

            reports.forEach((report, index) => {
                const reportTime = moment(report.created_at).tz(config.system.timeZone).format("DD/MM/YY HH:mm");

                message += quote(`ID Laporan: ${report.report_code}\n`);
                message += quote(`Pesan: ${report.message}\n`);
                message += quote(`Status: ${report.status}\n`);
                message += quote(`Dibuat: ${reportTime}\n`);
                if (report.admin_response) {
                    const shortResponse = report.admin_response.length > 50 ? 
                        report.admin_response.substring(0, 50) + '...' : 
                        report.admin_response;
                    message += quote(`Respon: ${shortResponse}\n`);
                    message += quote(`Ditangani: ${report.admin_id}\n`);
                }
                message += (`\n`);
            });

            return await ctx.reply(message);

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 