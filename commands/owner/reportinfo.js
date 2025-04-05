const { quote, monospace } = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

module.exports = {
    name: "reportinfo",
    aliases: ["inforeport", "reportdetail"],
    category: "admin",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        let reportCode = ctx.args[0];

        if (!reportCode) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "#123"))
        );

        // Tambahkan # jika belum ada
        if (!reportCode.startsWith('#')) {
            reportCode = `#${reportCode}`;
        }

        try {
            // Ambil detail laporan
            const report = await Database.getReportByCode(reportCode);

            if (!report) {
                return await ctx.reply(quote(`❎ Laporan dengan nomor ${reportCode} tidak ditemukan.`));
            }

            // Format waktu
            const reportTime = moment(report.created_at).tz(config.system.timeZone).format("DD/MM/YY HH:mm:ss");
            const resolvedTime = report.resolved_at ? 
                moment(report.resolved_at).tz(config.system.timeZone).format("DD/MM/YY HH:mm:ss") : 
                "-";

            // Format pesan
            let message = quote(`DETAIL LAPORAN\n\n` +
                quote(`Nomor Laporan: ${report.report_code}\n`) +
                quote(`Status: ${report.status}\n`) +
                quote(`Dari: ${report.reporter_name || 'No Name'}\n`) +
                quote(`Nomor: @${report.user_id}\n`) +
                quote(`Waktu Lapor: ${reportTime}\n`) +
                quote(`Waktu Selesai: ${resolvedTime}\n`) +
                `${report.admin_name ? quote(`Ditangani: ${report.admin_name}\n`) : ''}` +
                quote(`Pesan:${report.message}\n`) +
                `${report.admin_response ? quote(`Respon Admin:${report.admin_response}\n`) : ''}`);

            return await ctx.reply({
                text: message,
                mentions: [`${report.user_id}@s.whatsapp.net`]
            });

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 