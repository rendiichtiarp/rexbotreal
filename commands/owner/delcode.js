const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "delcode",
    aliases: ["deletecode", "hapuskode"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const code = ctx.args[0]?.toUpperCase();

        if (!code) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "ULTAH2024"))
        );

        try {
            await Database.deleteRedeemCode(code);
            return await ctx.reply(quote(`✅ Kode redeem ${code} berhasil dihapus!`));
        } catch (error) {
            return await ctx.reply(quote(`❎ ${error.message}`));
        }
    }
};
