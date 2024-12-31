const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "ping",
    category: "information",
    handler: {},
    code: async (ctx) => {
        const startTime = performance.now();
        if (await handler(ctx, module.exports.handler)) return;

        const responseTime = (performance.now() - startTime).toFixed(2);
        return await ctx.reply(quote(`🚀 Pong! Merespon dalam ${responseTime} ms.`));
    }
};