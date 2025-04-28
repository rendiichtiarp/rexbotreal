const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");


module.exports = {
    name: "coin",
    aliases: ["koin"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);
        const userDb = await Database.getUser(senderId);

        if (tools.general.isOwner(senderId) || userDb?.premium) return await ctx.reply(quote("🤑 Anda memiliki koin tak terbatas."));

        try {
            const userCoin = userDb?.coin || 0;

            return await ctx.reply(quote(`💰 Anda memiliki ${userCoin} koin tersisa.\n\n`) +
                quote(`💡Ketik ${monospace(`${ctx.used.prefix}claim list`)} untuk melihat daftar hadiah yang dapat diklaim.\n`) +
                quote(`💡Bermain game di ${monospace(`${ctx.used.prefix}menu game`)} untuk mendapatkan koin tambahan`)
            );
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};