const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
    name: "hunt",
    category: "minigames",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);
        const input = parseInt(ctx.args[0]);

        try {
            // Cek input
            if (!input || isNaN(input)) return await ctx.reply(
                `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                quote(tools.msg.generateCommandExample(ctx.used, `10`))
            );

            // Cek saldo user
            const userDB = await Database.getUser(senderId);
            if (!userDB || userDB.coin < input) {
                return await ctx.reply(quote("❎ Coin kamu tidak cukup!"));
            }

            // Kurangi coin user
            await Database.updateUser(senderId, {
                coin: userDB.coin - input
            });

            // Sistem hunt dengan probabilitas dan variasi item
            const hunt = {
                nothing: [
                    { chance: 25, message: "Kamu tidak menemukan apapun...", name: "Nothing", minPrice: 0, maxPrice: 0 },
                    { chance: 20, message: "Kamu hanya menemukan jejak kaki...", name: "Nothing", minPrice: 0, maxPrice: 0 },
                    { chance: 20, message: "Buruan kabur sebelum kamu mendekat...", name: "Nothing", minPrice: 0, maxPrice: 0 }
                ],
                trash: [
                    { chance: 12, message: "Kamu menemukan sampah... 🗑️", name: "Sampah", minPrice: 5, maxPrice: 8 },
                    { chance: 10, message: "Kamu mendapat ranting pohon... 🌿", name: "Ranting", minPrice: 6, maxPrice: 10 },
                    { chance: 8, message: "Kamu mendapat batu... 🪨", name: "Batu", minPrice: 7, maxPrice: 12 }
                ],
                common: [
                    { chance: 6, message: "Kamu menemukan kelinci! 🐰", name: "Kelinci", minPrice: 10, maxPrice: 15 },
                    { chance: 5, message: "Kamu menangkap ayam hutan! 🐔", name: "Ayam Hutan", minPrice: 12, maxPrice: 18 },
                    { chance: 4, message: "Kamu menemukan bebek liar! 🦆", name: "Bebek Liar", minPrice: 15, maxPrice: 20 },
                    { chance: 3, message: "Kamu menangkap tupai! 🐿️", name: "Tupai", minPrice: 18, maxPrice: 25 }
                ],
                uncommon: [
                    { chance: 2, message: "Kamu menemukan rusa! 🦌", name: "Rusa", minPrice: 25, maxPrice: 35 },
                    { chance: 1.8, message: "Kamu menangkap rubah! 🦊", name: "Rubah", minPrice: 30, maxPrice: 40 },
                    { chance: 1.5, message: "Kamu menemukan berang-berang! 🦫", name: "Berang-berang", minPrice: 35, maxPrice: 45 },
                    { chance: 1.2, message: "Kamu menangkap landak! 🦔", name: "Landak", minPrice: 40, maxPrice: 50 }
                ],
                rare: [
                    { chance: 0.8, message: "Kamu menemukan serigala! 🐺", name: "Serigala", minPrice: 50, maxPrice: 70 },
                    { chance: 0.6, message: "Kamu menangkap beruang! 🐻", name: "Beruang", minPrice: 60, maxPrice: 80 },
                    { chance: 0.4, message: "Kamu menemukan singa gunung! 🦁", name: "Singa Gunung", minPrice: 70, maxPrice: 90 },
                    { chance: 0.2, message: "Kamu menangkap buaya! 🐊", name: "Buaya", minPrice: 80, maxPrice: 100 }
                ],
                epic: [
                    { chance: 0.08, message: "Kamu menemukan harimau! 🐯", name: "Harimau", minPrice: 100, maxPrice: 150 },
                    { chance: 0.06, message: "Kamu menangkap gorila! 🦍", name: "Gorila", minPrice: 120, maxPrice: 170 },
                    { chance: 0.04, message: "Kamu menemukan badak! 🦏", name: "Badak", minPrice: 140, maxPrice: 190 },
                    { chance: 0.02, message: "Kamu menangkap gajah! 🐘", name: "Gajah", minPrice: 160, maxPrice: 200 }
                ],
                legendary: [
                    { chance: 0.008, message: "WOW! Kamu menemukan naga! 🐲", name: "Naga", minPrice: 200, maxPrice: 300 },
                    { chance: 0.006, message: "GILA! Kamu menangkap phoenix! 🦅", name: "Phoenix", minPrice: 250, maxPrice: 350 },
                    { chance: 0.004, message: "JACKPOT! Kamu menemukan unicorn! 🦄", name: "Unicorn", minPrice: 300, maxPrice: 400 },
                    { chance: 0.002, message: "SUPER JACKPOT! Kamu menemukan naga emas! ⚜️", name: "Naga Emas", minPrice: 350, maxPrice: 500 }
                ]
            };

            // Hitung total chance untuk normalisasi
            const totalProbability = Object.values(hunt).reduce((total, items) => 
                total + items.reduce((sum, item) => sum + item.chance, 0), 0);

            // Generate random number berdasarkan total probabilitas
            const random = Math.random() * totalProbability;
            let currentTotal = 0;

            // Pilih beberapa hasil hunt secara random
            const results = [];
            const maxItems = 3; // Maksimal 3 item per hunt
            let remainingChance = Math.random(); // Peluang mendapat item tambahan

            // Pilih item pertama (selalu dapat 1 item)
            outerLoop: for (const [tier, items] of Object.entries(hunt)) {
                for (const item of items) {
                    currentTotal += item.chance;
                    if (random <= currentTotal) {
                        results.push({
                            tier,
                            ...item
                        });
                        break outerLoop;
                    }
                }
            }

            // Kemungkinan dapat item tambahan
            for (let i = 1; i < maxItems; i++) {
                if (Math.random() < remainingChance) {
                    const bonusRandom = Math.random() * totalProbability;
                    currentTotal = 0;
                    
                    outerLoop: for (const [tier, items] of Object.entries(hunt)) {
                        for (const item of items) {
                            currentTotal += item.chance;
                            if (bonusRandom <= currentTotal) {
                                results.push({
                                    tier,
                                    ...item
                                });
                                break outerLoop;
                            }
                        }
                    }
                    remainingChance *= 0.3; // Menurunkan peluang dapat item berikutnya
                }
            }

            // Format pesan hasil
            let text = `${quote("🏹 Hasil Berburu:")}\n`;
            text += `${quote(`💰 -${input} coin`)}\n\n`;

            // Proses setiap item yang didapat
            for (const result of results) {
                text += quote(result.message);
                
                if (result.tier !== 'nothing') {
                    try {
                        // Generate random price antara min dan max
                        const sellPrice = Math.floor(
                            Math.random() * (result.maxPrice - result.minPrice + 1) + result.minPrice
                        );

                        await Database.addItemToInventory(senderId, {
                            tier: result.tier,
                            name: result.name,
                            coin: sellPrice
                        });

                        text += `\n`;
                    } catch (error) {
                        text += `\n${quote(`❌ Gagal menyimpan ${result.name}: ${error.message}`)}\n`;
                    }
                } else {
                    text += '\n';
                }
            }

            text += `\n${quote(`💡 Ketik .inventory untuk melihat item`)}\n`;
            text += `\n${config.msg.footer}`;

            return await ctx.reply(text);

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 