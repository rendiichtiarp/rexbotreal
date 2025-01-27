const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const os = require("os");

module.exports = {
    name: "server",
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const startTime = config.bot.readyAt;

            return await ctx.reply(
                `${(`OS: ${os.type()} (${os.arch()} / ${os.release()})`)}\n` +
                `${(`Prosesor: ${os.cpus()[0].model}`)}\n` +
                `${(`RAM: ${tools.general.formatSize(process.memoryUsage().rss)} / ${tools.general.formatSize(os.totalmem())}`)}\n` +
                `${(`Uptime: ${tools.general.convertMsToDuration(Date.now() - startTime)}`)}\n` +
                "\n" +
                config.msg.footer
            );
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};