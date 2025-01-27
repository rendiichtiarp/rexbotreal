const {
    quote
} = require("@mengkodingan/ckptw");
const {
    performance
} = require("perf_hooks");

module.exports = {
    name: "speed",
    category: "information",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const startTime = performance.now();
            const testMsg = await ctx.reply(quote("🚀 Speed test..."));
            const responseTime = (performance.now() - startTime).toFixed(2);
            await ctx.editMessage(testMsg.key, quote(`🚀 Respons time ${responseTime} ms.`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};