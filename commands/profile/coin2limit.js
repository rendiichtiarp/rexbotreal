const { 
    quote 
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "buylimit",
    aliases: ["coin2limit", "bl"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.msg.generateCommandExample(ctx.used, "10"))}\n`
        );

        const senderId = tools.general.getID(ctx.sender.jid);
        const userDb = await Database.getUser(senderId);

        // Cek jika user premium atau owner
        if (tools.general.isOwner(senderId) || userDb?.premium) {
            return await ctx.reply(quote(`❎ Anda memiliki limit unlimited, tidak perlu membeli limit.`));
        }

        const amount = parseInt(ctx.args[0]) || 1;

        if (amount < 1) {
            return await ctx.reply(quote(`❎ Minimal membeli 1 limit.`));
        }

        const coinNeeded = amount * 100;
        if ((userDb?.coin || 0) < coinNeeded) {
            return await ctx.reply(quote(
                `❎ Coin tidak cukup! Dibutuhkan ${coinNeeded} coin untuk membeli ${amount} limit.\n` +
                `> Claim coin harian menggunakan .claim atau bermain game`
            ));
        }

        try {
            await Database.updateUser(senderId, {
                coin: (userDb?.coin || 0) - coinNeeded,
                user_limit: (userDb?.user_limit || 0) + amount
            });

            return await ctx.reply(quote(`✅ Berhasil membeli ${amount} limit dengan ${coinNeeded} coin!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};
