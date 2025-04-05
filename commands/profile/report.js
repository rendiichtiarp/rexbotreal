const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");

module.exports = {
    name: "report",
    aliases: ["bug", "error", "lapor"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;
        const userDb = await Database.getUser(tools.general.getID(ctx.sender.jid));

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "Fitur tiktok error saat download"))
        );

        try {
            // Dapatkan informasi pengirim
            const sender = ctx.sender;
            const senderName = userDb.name || "No Name";
            const senderNumber = tools.general.getID(sender.jid);

            // Format waktu
            const reportTime = moment().tz(config.system.timeZone).format("DD/MM/YY HH:mm:ss");

            // Simpan laporan ke database
            const report = await Database.createReport(senderNumber, input);

            // Buat pesan report
            const reportMessage = `${quote("LAPORAN PENGGUNA")}\n\n` +
                `${quote(`Dari: ${senderName}`)}\n` +
                `${quote(`Nomor: @${senderNumber}`)}\n` +
                `${quote(`Nomor Laporan: ${report.reportCode}`)}\n` +
                `${quote(`⏰ Waktu: ${reportTime}`)}\n\n` +
                `${quote("📝 Pesan:")}\n` +
                `${quote(input)}\n\n` +
                `${quote(config.msg.footer)}`;

            // Kirim ke grup report
            if (config.bot.groups?.report) {
                try {
                    await ctx.sendMessage(config.bot.groups.report, {
                        text: reportMessage,
                        mentions: [sender.jid]
                    });
                } catch (error) {
                    consolefy.error(`Error sending to report group: ${error}`);
                    return await ctx.reply(quote(`❎ Gagal mengirim laporan, silakan coba lagi nanti.`));
                }
            } else {
                return await ctx.reply(quote(`❎ Grup report belum dikonfigurasi.`));
            }

            // Kirim konfirmasi ke pengirim
            return await ctx.reply(
                `${quote("✅ Laporan telah dikirim!")}\n\n` +
                `${quote(`🔢 Nomor Laporan: ${report.reportCode}`)}\n\n` +
                `${quote("Terima kasih atas laporannya. Kami akan segera menindaklanjuti.")}\n` +
                `${quote(tools.cmd.generateNotes([`Untuk melihat status laporan Anda, gunakan ${monospace(`${ctx.used.prefix}myreport`)}`]))}`
            );

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
