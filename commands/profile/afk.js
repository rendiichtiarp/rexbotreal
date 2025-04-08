const {
    quote
} = require("@mengkodingan/ckptw");


module.exports = {
    name: "afk",
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;
        const senderId = tools.general.getID(ctx.sender.jid);

        try {
            // Update status AFK user di database
            await Database.updateAfk(senderId, {
                reason: input,
                timestamp: Date.now()
            });

            return await ctx.reply(quote(`📴 Anda akan AFK, ${input ? `dengan alasan "${input}"` : "tanpa alasan apapun"}.`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};