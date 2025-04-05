const { quote } = require("@mengkodingan/ckptw");

module.exports = {
    name: "reportupdate",
    aliases: ["updatereport", "responreport"],
    category: "admin",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        let [reportCode, status, ...responseArr] = ctx.args;
        const response = responseArr?.join(" ");

        if (!reportCode || !status) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["nomor laporan", "status", "respon (opsional)"]))}\n` +
            `${quote("Status: pending/process/done/rejected")}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "#123 done Sudah diperbaiki"))
        );

        // Tambahkan # jika belum ada
        if (!reportCode.startsWith('#')) {
            reportCode = `#${reportCode}`;
        }

        try {
            // Validasi status
            const validStatus = ['pending', 'process', 'done', 'rejected'];
            if (!validStatus.includes(status.toLowerCase())) {
                return await ctx.reply(quote(`❎ Status tidak valid. Gunakan: ${validStatus.join('/')}`));
            }

            // Ambil detail laporan
            const report = await Database.getReportByCode(reportCode);
            if (!report) {
                return await ctx.reply(quote(`❎ Laporan dengan nomor ${reportCode} tidak ditemukan.`));
            }

            // Update laporan
            const adminId = tools.general.getID(ctx.sender.jid);
            await Database.updateReport(reportCode, {
                status: status.toLowerCase(),
                admin_response: response || report.admin_response
            }, adminId);

            // Kirim notifikasi ke pengirim laporan
            const statusMsg = {
                'done': 'telah selesai ditangani',
                'process': 'sedang diproses',
                'rejected': 'ditolak',
                'pending': 'dalam antrian'
            };

            const notifMessage = `${quote("UPDATE LAPORAN")}\n\n` +
                `${quote(`Laporan Anda dengan nomor ${reportCode} ${statusMsg[status.toLowerCase()]}`)}\n` +
                (response ? `${quote(`Respon Admin: ${response}`)}\n` : '') +
                `${quote(config.msg.footer)}`;

            await ctx.sendMessage(`${report.user_id}@s.whatsapp.net`, {
                text: notifMessage
            });

            return await ctx.reply(quote(`✅ Berhasil memperbarui laporan ${reportCode}`));

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 