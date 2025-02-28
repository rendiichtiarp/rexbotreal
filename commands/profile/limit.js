const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "limit",
    aliases: ["limit"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);
        const userDb = await Database.getUser(senderId);

        if (tools.general.isOwner(senderId) || userDb?.premium) return await ctx.reply(quote("🤑 Anda memiliki limit tak terbatas."));

        try {
            return await ctx.reply(quote(`💰 Anda memiliki ${userDb?.user_limit || 0} limit tersisa.\n` +
                `> Beli limit menggunakan .buylimit <jumlah>`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};