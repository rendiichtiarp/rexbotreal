const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "intro",
    category: "group",
    permissions: {
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        try {
            const groupId = ctx.isGroup() ? tools.general.getID(ctx.id) : null;
            const groupDb = await Database.getGroup(groupId);
            const introText = groupDb?.intro_text || quote("❎ Grup ini tidak memiliki intro.");

            return await ctx.reply(introText);
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};