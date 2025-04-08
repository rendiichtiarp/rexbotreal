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
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "ULTAH2024 coin 1000 0 0"))}\n` +
            quote(tools.cmd.generateNotes([
                "Format: <kode> <tipe> <jumlah> [max_klaim] [masa_berlaku]",
                "Tipe hadiah: coin, premium",
                "Max klaim 0 = unlimited",
                "Masa berlaku 0 = unlimited"
            ]))
        );

        try {
            // Validasi input
            if (!/^[A-Z0-9]{4,20}$/.test(code)) {
                throw new Error("Kode harus 4-20 karakter (huruf kapital & angka)!");
            }

            if (!["coin", "premium"].includes(type)) {
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

            // Hitung tanggal kadaluarsa
            let expiredAt;
            if (expireDaysNum === 0) {
                // Set ke tahun 2030 untuk unlimited
                expiredAt = new Date('2030-12-31 23:59:59');
            } else {
                // Set tanggal kadaluarsa sesuai jumlah hari
                expiredAt = new Date();
                expiredAt.setDate(expiredAt.getDate() + expireDaysNum);
            }
            
            // Format tanggal ke format MySQL YYYY-MM-DD HH:mm:ss
            const formattedDate = expiredAt.toISOString().slice(0, 19).replace('T', ' ');

            // Simpan kode redeem
            await Database.createRedeemCode({
                code,
                reward_type: type,
                reward_amount: rewardAmount,
                max_claims: maxClaimsNum === 0 ? 999999 : maxClaimsNum, // Jika 0 set ke angka besar
                expired_at: formattedDate,
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
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
