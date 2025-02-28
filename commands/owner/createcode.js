const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "createcode",
    aliases: ["gencode", "buatkode"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const [code, type, amount, maxClaims = "0", expireDays = "0"] = ctx.args;

        if (!code || !type || !amount) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.msg.generateCommandExample(ctx.used, "ULTAH2024 coin 1000 0 0"))}\n` +
            quote(tools.msg.generateNotes([
                "Format: <kode> <tipe> <jumlah> [max_klaim] [masa_berlaku]",
                "Tipe hadiah: coin, limit, premium",
                "Max klaim 0 = unlimited",
                "Masa berlaku 0 = unlimited"
            ]))
        );

        try {
            // Validasi input
            if (!/^[A-Z0-9]{4,20}$/.test(code)) {
                throw new Error("Kode harus 4-20 karakter (huruf kapital & angka)!");
            }

            if (!["coin", "limit", "premium"].includes(type)) {
                throw new Error("Tipe hadiah tidak valid!");
            }

            const rewardAmount = parseInt(amount);
            if (isNaN(rewardAmount) || rewardAmount < 1) {
                throw new Error("Jumlah hadiah tidak valid!");
            }

            const maxClaimsNum = parseInt(maxClaims);
            if (isNaN(maxClaimsNum) || maxClaimsNum < 0) {
                throw new Error("Jumlah klaim maksimal tidak valid!");
            }

            const expireDaysNum = parseInt(expireDays);
            if (isNaN(expireDaysNum) || expireDaysNum < 0) {
                throw new Error("Masa berlaku tidak valid!");
            }

            // Hitung tanggal kadaluarsa (jika 0 maka set ke tahun 2099)
            const expiredAt = expireDaysNum === 0 
                ? new Date('2099-12-31') 
                : new Date(Date.now() + (expireDaysNum * 24 * 60 * 60 * 1000));

            // Simpan kode redeem
            await Database.createRedeemCode({
                code,
                reward_type: type,
                reward_amount: rewardAmount,
                max_claims: maxClaimsNum === 0 ? 999999 : maxClaimsNum, // Jika 0 set ke angka besar
                expired_at: expiredAt,
                created_by: tools.general.getID(ctx.sender.jid)
            });

            return await ctx.reply(quote(
                `✅ Kode redeem berhasil dibuat!\n\n` +
                `📝 Kode: ${code}\n` +
                `🎁 Hadiah: ${rewardAmount} ${type}\n` +
                `👥 Max Klaim: ${maxClaimsNum === 0 ? 'Unlimited' : maxClaimsNum}\n` +
                `📅 Kadaluarsa: ${expireDaysNum === 0 ? 'Unlimited' : `${expireDaysNum} hari`}`
            ));
        } catch (error) {
            return await ctx.reply(quote(`❎ ${error.message}`));
        }
    }
};
