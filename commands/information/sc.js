const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "sc",
    aliases: ["script", "source", "sourcecode"],
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        return await ctx.reply(
            `${("https://github.com/rendiichtiarp/rexbotreal (Private)")}\n` +
            "\n" +
            `${config.msg.footer}`
        ); // Jika Anda tidak menghapus ini, terima kasih!
    }
};