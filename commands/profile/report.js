const {
    quote
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
            quote(tools.cmd.generateCommandExample(ctx.used, "Min, fitur tiktok error"))
        );

        try {
            // Dapatkan informasi pengirim
            const sender = ctx.sender;
            const senderName = userDb.name || "No Name";
            const senderNumber = tools.general.getID(sender.jid);

            // Format waktu
            const reportTime = moment().tz(config.system.timeZone).format("DD/MM/YY HH:mm:ss");

            // Buat pesan report
            const reportMessage = `*📮 LAPORAN PENGGUNA*\n\n` +
                `*Dari:* ${senderName}\n` +
                `*Nomor:* @${senderNumber}\n` +
                `*Waktu:* ${reportTime}\n\n` +
                `*Pesan:*\n${input}\n\n` +
                `${config.msg.footer}`;

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
            return await ctx.reply(quote(`✅ Laporan telah dikirim!\nTerima kasih atas laporannya.`));

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
