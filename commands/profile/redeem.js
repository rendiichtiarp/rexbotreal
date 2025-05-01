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

            // Validasi kode redeem
            if (!redeemData) {
                return await ctx.reply(quote(`❎ Kode redeem tidak valid!`));
            }

            // Validasi waktu kadaluarsa
            if (redeemData.expired_at < new Date()) {
                return await ctx.reply(quote(`❎ Kode redeem sudah kadaluarsa!`));
            }

            // Validasi jumlah klaim
            if (redeemData.current_claims >= redeemData.max_claims) {
                return await ctx.reply(quote(`❎ Kode redeem sudah habis!`));
            }

            try {
                // Proses klaim kode
                const claimResult = await Database.claimRedeemCode(redeemData.id, senderId);
                
                // Update data user sesuai hadiah
                const userDb = await Database.getUser(senderId);
                const updateData = {};

                switch (redeemData.reward_type) {
                    case "coin":
                        updateData.coin = (userDb?.coin || 0) + redeemData.reward_amount;
                        break;
                    case "premium":
                        const premiumDuration = redeemData.reward_amount * 24 * 60 * 60 * 1000; // Konversi hari ke milidetik
                        if (userDb?.premium && userDb?.premium_expired > Date.now()) {
                            // Jika masih premium, tambahkan durasi baru ke sisa durasi
                            updateData.premium = true;
                            updateData.premium_expired = userDb.premium_expired + premiumDuration;
                        } else {
                            // Jika belum premium atau sudah expired, set durasi baru
                            updateData.premium = true;
                            updateData.premium_expired = Date.now() + premiumDuration;
                        }
                        break;
                }

                await Database.updateUser(senderId, updateData);

                let rewardText = "";
                if (redeemData.reward_type === "coin") {
                    rewardText = `🪙 ${redeemData.reward_amount} koin`;
                } else if (redeemData.reward_type === "premium") {
                    if (userDb?.premium && userDb?.premium_expired > Date.now()) {
                        const sisaHari = Math.ceil((userDb.premium_expired - Date.now()) / (24 * 60 * 60 * 1000));
                        rewardText = `⭐ Premium ${redeemData.reward_amount} hari (ditambahkan ke ${sisaHari} hari yang tersisa)`;
                    } else {
                        rewardText = `⭐ Premium ${redeemData.reward_amount} hari`;
                    }
                }

                return await ctx.reply(quote(
                    `✅ Selamat! Anda mendapatkan: ${rewardText}`
                ));

            } catch (error) {
                // Handle specific error cases
                switch(error.message) {
                    case 'ALREADY_CLAIMED':
                        return await ctx.reply(quote(`❎ Kamu sudah mengklaim kode ini!`));
                    case 'MAX_CLAIMS_REACHED':
                        return await ctx.reply(quote(`❎ Kode redeem sudah habis!`));
                    case 'INVALID_CODE':
                        return await ctx.reply(quote(`❎ Kode redeem tidak valid!`));
                    default:
                        return await ctx.reply(quote(`❎ Terjadi kesalahan saat mengklaim kode!`));
                }
            }
        } catch (error) {
            return await ctx.reply(quote(`❎ Terjadi kesalahan saat memproses kode redeem!`));
        }
    }
};
