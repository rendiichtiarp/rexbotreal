const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const userHelper = require('../../database/users');

module.exports = {
    name: "muslim",
    aliases: ["muslimai"],
    category: "ai-chat",
    handler: {
        limit: 1
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            (tools.msg.generateCommandExample(ctx._used, "jelaskan tentang Whatsapp!"))
        );

        try {
            const senderId = ctx.sender.jid.split(/[:@]/)[0];
            const userDb = await userHelper.getUser(senderId);
            const uid = userDb.uid || "guest";
            const apiUrl = tools.api.createUrl("fasturl", "/aillm/muslim", {
                ask: input,
                sessionId: uid
            });
            const {
                data
            } = await axios.get(apiUrl);

            return await ctx.reply(data.response);
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};