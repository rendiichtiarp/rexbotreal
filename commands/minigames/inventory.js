const { quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
    name: "inventory",
    aliases: ["inv"],
    category: "minigames",
    permissions: {},
    code: async (ctx) => {
        const senderId = tools.general.getID(ctx.sender.jid);

        try {
            const inventory = await Database.getInventory(senderId);

            if (!inventory.length) {
                return await ctx.reply(
                    `${quote("📦 Inventori Kosong!")}\n` +
                    `${quote("💡 Gunakan .hunt untuk berburu")}\n` +
                    config.msg.footer
                );
            }

            // Emoji untuk setiap item
            const itemEmojis = {
                // Trash
                "Sampah": "🗑️",
                "Ranting": "🌿",
                "Batu": "🪨",
                // Common
                "Kelinci": "🐰",
                "Ayam Hutan": "🐔",
                "Bebek Liar": "🦆",
                "Tupai": "🐿️",
                // Uncommon
                "Rusa": "🦌",
                "Rubah": "🦊",
                "Berang-berang": "🦫",
                "Landak": "🦔",
                // Rare
                "Serigala": "🐺",
                "Beruang": "🐻",
                "Singa Gunung": "🦁",
                "Buaya": "🐊",
                // Epic
                "Harimau": "🐯",
                "Gorila": "🦍",
                "Badak": "🦏",
                "Gajah": "🐘",
                // Legendary
                "Naga": "🐲",
                "Phoenix": "🦅",
                "Unicorn": "🦄",
                "Naga Emas": "⚜️"
            };

            let text = `${quote(`INVENTORY LIST`)}\n\n`;

            // Kelompokkan dan urutkan item berdasarkan tier
            const tierOrder = ['legenda', 'epik', 'sangat_langka', 'langka', 'umum', 'sampah'];
            const tierNames = {
                'legenda': 'LEGENDA',
                'epik': 'EPIK', 
                'sangat_langka': 'SANGAT LANGKA',
                'langka': 'LANGKA',
                'umum': 'UMUM',
                'sampah': 'SAMPAH'
            };
            const grouped = inventory.reduce((acc, item) => {
                if (!acc[item.item_tier]) acc[item.item_tier] = [];
                acc[item.item_tier].push(item);
                return acc;
            }, {});

            // Hitung total item dan nilai
            let totalItems = 0;
            let totalValue = 0;

            for (const tier of tierOrder) {
                const items = grouped[tier];
                if (items) {
                    text += quote(`[ ${tierNames[tier]} ]`);
                    items.forEach(item => {
                        totalItems += item.quantity;
                        totalValue += (item.sell_price * item.quantity);
                        const emoji = itemEmojis[item.item_name] || "";
                        text += `\n${quote(`${emoji} (${item.quantity}x) - ${item.sell_price} Coin ↴`)}`;
                        text += `\n${quote(`ID: ${item.item_id}`)}`;
                    });
                    text += '\n\n';
                }
            }

            text += quote(`Total: ${totalItems} item - ${totalValue} Coin`);
            text += `\n${quote(`Ketik .sell <id> <jumlah> untuk menjual`)}\n`;
            text += `${quote(`Ketik .sell all untuk menjual semua`)}\n`;
            text += `\n${config.msg.footer}`;

            return await ctx.reply(text);
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
}; 