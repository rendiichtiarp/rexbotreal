const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
    name: "hunt",
    category: "game",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);
        const args = ctx.args;
        
        // Cek argumen jumlah coin
        if (!args[0]) {
            return await ctx.reply(
                `${quote("📌 Cara Penggunaan:")}\n` +
                `${quote(".hunt <jumlah_coin>")}\n\n` +
                `${quote("Contoh: .hunt 1000")}\n\n` +
                `${quote("Probabilitas:")}\n` +
                `${quote("• 40% - Kehilangan semua coin")}\n` +
                `${quote("• 30% - Kehilangan setengah coin")}\n` +
                `${quote("• 20% - Mendapat 2x coin")}\n` +
                `${quote("• 8% - Mendapat 3x coin")}\n` +
                `${quote("• 2% - Mendapat 5x coin")}\n\n` +
                config.msg.footer
            );
        }

        try {
            const amount = parseInt(args[0]);

            // Validasi input
            if (isNaN(amount)) {
                return await ctx.reply(quote("❎ Jumlah coin harus berupa angka!"));
            }
            if (amount < 1) {
                return await ctx.reply(quote("❎ Jumlah coin tidak valid!"));
            }

            // Cek saldo user
            const userDB = await Database.getUser(senderId);
            if (!userDB || userDB.coin < amount) {
                return await ctx.reply(quote("❎ Coin kamu tidak cukup!"));
            }

            // Sistem hunt dengan probabilitas
            const hunt = {
                lose_all: { chance: 40, multiplier: 0 },    // 40% chance
                lose_half: { chance: 30, multiplier: 0.5 }, // 30% chance
                double: { chance: 20, multiplier: 2 },      // 20% chance
                triple: { chance: 8, multiplier: 3 },       // 8% chance
                jackpot: { chance: 2, multiplier: 5 }       // 2% chance
            };

            const random = Math.random() * 100;
            let result;
            let totalChance = 0;

            for (const [type, data] of Object.entries(hunt)) {
                totalChance += data.chance;
                if (random <= totalChance) {
                    const winAmount = Math.floor(amount * data.multiplier);
                    const netGain = winAmount - amount;
                    result = {
                        type,
                        multiplier: data.multiplier,
                        amount: winAmount,
                        netGain
                    };
                    break;
                }
            }

            // Update coin di database
            await Database.updateUser(senderId, {
                coin: userDB.coin - amount + result.amount
            });

            // Emoji dan pesan berdasarkan hasil
            const resultEmoji = {
                lose_all: "💔",
                lose_half: "💸",
                double: "💰",
                triple: "🤑",
                jackpot: "🎯"
            };

            const resultMessage = {
                lose_all: "Kamu kehilangan semua coin!",
                lose_half: "Kamu kehilangan setengah coin!",
                double: "Selamat! Coin-mu berlipat 2x!",
                triple: "Wow! Coin-mu berlipat 3x!",
                jackpot: "JACKPOT! Coin-mu berlipat 5x!"
            };

            // Format pesan hasil
            return await ctx.reply(
                `${quote(`${resultEmoji[result.type]} Hunt Result:`)}\n` +
                `${quote(resultMessage[result.type])}\n` +
                `${quote(`Coin Taruhan: ${amount}`)}\n` +
                `${quote(`Hasil: ${result.amount}`)}\n` +
                `${quote(`Keuntungan: ${result.netGain}`)}\n` +
                `${quote(`Saldo: ${userDB.coin - amount + result.amount} coin`)}\n\n` +
                config.msg.footer
            );

        } catch (error) {
            if (session.has(ctx.id)) {
                session.delete(ctx.id);
            }
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 