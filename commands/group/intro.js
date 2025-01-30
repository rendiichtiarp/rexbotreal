const {
    quote
} = require("@mengkodingan/ckptw");
const groupHelper = require('../../database/groups');

module.exports = {
    name: "intro",
    category: "group",
    handler: {
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const groupId = ctx.isGroup() ? ctx.id.split("@")[0] : null;
            const groupDb = await groupHelper.getGroup(groupId);
            const introText = groupDb?.text_intro || quote("❎ Grup ini tidak memiliki intro.");

            return await ctx.reply(introText);
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};