const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "donate",
    aliases: ["donasi"],
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        return await ctx.reply(
            `${monospace("💸 Donasi melalui pembayaran dibawah ini:")}\n\n` +
            `${monospace("📱 QRIS:\nhttps://i.imgur.com/FelT7zk.png")}\n\n` +
            `${monospace("💳 DANA/GOPAY:\n081284900651")}\n\n` +
            `${monospace("Setelah melakukan pembayaran harap hubungi owner dengan mengirimkan bukti pembayaran.")}\n`
        );
    }
};