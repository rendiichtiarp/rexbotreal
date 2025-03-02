const {
    quote
} = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
    name: "sell",
    category: "minigames",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);
        const [itemId, quantityStr] = ctx.args;

        try {
            if (!itemId || isNaN(itemId)) return await ctx.reply(
                    `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                    `${quote(tools.msg.generateCommandExample(ctx.used, `<item_id> <jumlah>`))}\n` +
                    `${quote(`atau`)}\n` +
                    `${quote(tools.msg.generateCommandExample(ctx.used, `all`))}`
                );
            
            if (itemId.toLowerCase() === 'all') {
                const inventory = await Database.getInventory(senderId);
                if (!inventory.length) {
                    return await ctx.reply(quote("❎ Inventori kosong!"));
                }

                let totalEarnings = 0;
                let soldItems = [];

                for (const item of inventory) {
                    try {
                        const result = await Database.sellItem(senderId, item.item_id, item.quantity);
                        totalEarnings += result.totalPrice;
                        soldItems.push({
                            name: result.itemName,
                            quantity: result.soldQuantity,
                            price: result.totalPrice
                        });
                    } catch (error) {
                        console.error(`Error selling ${item.item_id}:`, error);
                    }
                }

                if (!soldItems.length) {
                    return await ctx.reply(quote("❎ Gagal menjual item!"));
                }

                // Format pesan hasil
                let text = `${quote("💰 Hasil Penjualan Semua Item:")}\n\n`;
                
                // Kelompokkan berdasarkan tier untuk tampilan yang lebih rapi
                const tierEmoji = {
                    trash: "🗑️",
                    common: "⭐",
                    uncommon: "⭐⭐",
                    rare: "⭐⭐⭐",
                    epic: "🌟",
                    legendary: "👑"
                };

                const grouped = inventory.reduce((acc, item) => {
                    if (!acc[item.item_tier]) acc[item.item_tier] = [];
                    acc[item.item_tier].push(item);
                    return acc;
                }, {});

                const tierOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common', 'trash'];
                
                for (const tier of tierOrder) {
                    const items = grouped[tier];
                    if (items) {
                        text += quote(`${tierEmoji[tier]} ${tier.toUpperCase()}:`);
                        items.forEach(item => {
                            const sold = soldItems.find(s => s.name === item.item_name);
                            if (sold) {
                                text += `\n${quote(`• ${sold.name} (${sold.quantity}x) +${sold.price}c`)}`;
                            }
                        });
                        text += '\n\n';
                    }
                }

                text += quote(`Total: +${totalEarnings} coin`);

                // Ambil data user terbaru
                const userDB = await Database.getUser(senderId);
                text += `\n${quote(`Saldo: ${userDB.coin} coin`)}`;
                text += `\n${config.msg.footer}`;

                return await ctx.reply(text);
            }

            // Jual item spesifik
            const quantity = parseInt(quantityStr) || 1;
            if (quantity < 1) {
                return await ctx.reply(quote("❎ Jumlah item tidak valid!"));
            }

            // Jual item
            const result = await Database.sellItem(senderId, itemId, quantity);

            // Format pesan hasil
            let text = `${quote("💰 Hasil Penjualan:")}\n`;
            text += quote(`• Item: ${result.itemName}`);
            text += `\n${quote(`• Jumlah: ${result.soldQuantity}x`)}`;
            text += `\n${quote(`• Total: +${result.totalPrice} coin`)}\n\n`;

            // Ambil data user terbaru
            const userDB = await Database.getUser(senderId);
            text += quote(`Saldo: ${userDB.coin} coin`);
            text += `\n${config.msg.footer}`;

            return await ctx.reply(text);

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 