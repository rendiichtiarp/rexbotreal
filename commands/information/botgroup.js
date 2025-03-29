const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "botgroup",
    aliases: ["groupbot", "grupbot", "botgrup"],
    category: "information",
    permissions: {},
    code: async (ctx) => {
        return await ctx.reply(quote(config.bot.groupLink));
    }
};