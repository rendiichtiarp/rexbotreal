const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "tqto",
    aliases: ["thanksto"],
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        return await ctx.reply(
            `${("- Allah SWT")}\n` +
            `${("- Kedua ortu")}\n` +
            `${("- Myrex Team")}\n` +
            `${("- Teman - Teman")}\n` +
            `${quote("Terima kasih yang sudah support project ini.")}\n` +
            "\n" +
            config.msg.footer
        ); // Jika Anda tidak menghapus ini, terima kasih!
    }
};