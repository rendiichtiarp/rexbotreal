const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "redeem",
    aliases: ["tukar"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const code = ctx.args[0]?.toUpperCase();

        if (!code) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "ULTAH2024"))
        );

        try {
            const senderId = tools.general.getID(ctx.sender.jid);
            const redeemData = await Database.getRedeemCode(code);

            if (!redeemData) {
                throw new Error("Kode redeem tidak valid!");
            }

            if (redeemData.expired_at < new Date()) {
                throw new Error("Kode redeem sudah kadaluarsa!");
            }

            // Proses klaim kode
            await Database.claimRedeemCode(redeemData.id, senderId);

            // Update data user sesuai hadiah
            const userDb = await Database.getUser(senderId);
            const updateData = {};

            switch (redeemData.reward_type) {
                case "coin":
                    updateData.coin = (userDb?.coin || 0) + redeemData.reward_amount;
                    break;
                case "premium":
                    updateData.premium = true;
                    break;
            }

            await Database.updateUser(senderId, updateData);

            return await ctx.reply(quote(
                `✅ Selamat! Anda mendapatkan: 🎁 ${redeemData.reward_amount} ${redeemData.reward_type}`
            ));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
