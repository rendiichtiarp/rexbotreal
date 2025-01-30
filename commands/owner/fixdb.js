const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');
const menfessHelper = require('../../database/menfess');
const groupHelper = require('../../database/groups');
const botHelper = require('../../database/bot');

module.exports = {
    name: "fixdb",
    aliases: ["fixdatabase"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args[0] || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used, `user`))
        );

        if (input === "list") {
            const listText = await tools.list.get("fixdb");
            return await ctx.reply(listText);
        }

        try {
            const waitMsg = await ctx.reply(config.msg.wait);

            switch (input) {
                case "user": {
                    await ctx.editMessage(waitMsg.key, quote(`🔄 Memperbaiki data pengguna...`));
                    
                    // Reset nilai yang tidak valid
                    await userHelper.fixUserData();
                    // Hapus user yang tidak valid (no_user bukan angka)
                    // Reset coin/limit/level/xp yang minus
                    // Reset status premium yang kadaluarsa
                    // Reset status banned yang tidak valid
                    // Reset status afk yang terlalu lama
                    break;
                }

                case "group": {
                    await ctx.editMessage(waitMsg.key, quote(`🔄 Memperbaiki data grup...`));
                    
                    // Reset nilai boolean yang tidak valid
                    await groupHelper.fixGroupData();
                    // Hapus grup yang sudah tidak ada botnya
                    // Reset text welcome/goodbye/intro yang tidak valid
                    // Reset pengaturan yang tidak konsisten
                    break;
                }

                case "menfess": {
                    await ctx.editMessage(waitMsg.key, quote(`🔄 Membersihkan data menfess...`));
                    
                    // Hapus menfess yang sudah lama
                    await menfessHelper.resetMenfessData();
                    break;
                }

                case "bot": {
                    await ctx.editMessage(waitMsg.key, quote(`🔄 Memperbaiki pengaturan bot...`));
                    
                    // Reset pengaturan yang tidak valid
                    // Hapus pengaturan yang tidak terpakai
                    // Reset mode yang tidak konsisten
                    await botHelper.fixBotData();
                    break;
                }

                case "all": {
                    await ctx.editMessage(waitMsg.key, quote(`🔄 Memperbaiki semua data...`));
                    
                    // Jalankan semua perbaikan
                    await userHelper.fixUserData();
                    await groupHelper.fixGroupData();
                    await menfessHelper.resetMenfessData();
                    await botHelper.fixBotData();
                    break;
                }

                case "clean": {
                    await ctx.editMessage(waitMsg.key, quote(`🔄 Membersihkan semua data...`));
                    
                    // Hapus semua data
                    await userHelper.cleanUserData();
                    await groupHelper.cleanGroupData();
                    await menfessHelper.cleanMenfessData();
                    await botHelper.cleanBotData();
                    break;
                }

                default: {
                    return await ctx.reply(quote(`❎ Key '${input}' tidak valid!`));
                }
            }

            return await ctx.editMessage(waitMsg.key, quote(`✅ Basis data berhasil diperbaiki untuk ${input}!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};