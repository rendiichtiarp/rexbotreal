const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "donate",
    aliases: ["donasi"],
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        return await ctx.reply(
            `${("https://i.imgur.com/FelT7zk.png (QRIS)")}\n` +
            `${("081284900651 (DANA)")}\n` +
            `${("081284900651 (GOPAY)")}\n` +
            "\n"
        );
    }
};