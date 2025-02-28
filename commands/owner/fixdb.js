const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");


module.exports = {
    name: "fixdb",
    aliases: ["fixdatabase"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.args[0] || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx.used, "user"))
        );

        if (input === "list") {
            const listText = await tools.list.get("fixdb");
            return await ctx.reply(listText);
        }

        try {
            const waitMsg = await ctx.reply(config.msg.wait);

            const processUsers = async () => {
                await ctx.editMessage(waitMsg.key, quote(`🔄 Memproses data user...`));
                const users = await Database.getAllUsers();
                
                for (const user of users) {
                    // Validasi dan perbaiki data user
                    const cleanData = {
                        coin: Math.max(0, user.coin || 0),
                        user_limit: Math.max(0, user.user_limit || 10),
                        level: tools.general.clamp(user.level || 0, 0, 100),
                        xp: Math.max(0, user.xp || 0),
                        premium: Boolean(user.premium),
                        banned: Boolean(user.banned),
                        autolevelup: Boolean(user.autolevelup),
                        win_game: Math.max(0, user.win_game || 0),
                        registered: Boolean(user.registered)
                    };
                    
                    await Database.updateUser(user.id, cleanData);
                }
            };

            const processGroups = async () => {
                await ctx.editMessage(waitMsg.key, quote(`🔄 Memproses data grup...`));
                const groups = await Database.getAllGroups();
                
                for (const group of groups) {
                    // Validasi dan perbaiki data grup
                    const cleanData = {
                        mute: Boolean(group.mute),
                        antilink: Boolean(group.antilink),
                        antinsfw: Boolean(group.antinsfw),
                        antispam: Boolean(group.antispam),
                        antisticker: Boolean(group.antisticker),
                        antitoxic: Boolean(group.antitoxic),
                        welcome: Boolean(group.welcome),
                        autokick: Boolean(group.autokick)
                    };
                    
                    await Database.updateGroup(group.id, cleanData);
                }
            };

            const processMenfess = async () => {
                await ctx.editMessage(waitMsg.key, quote(`🔄 Memproses data menfess...`));
                const menfessData = await Database.getMenfess();
                
                for (const menfess of menfessData) {
                    // Validasi dan perbaiki data menfess
                    if (!menfess.from_user || !menfess.to_user) {
                        await Database.deleteMenfess(menfess.id);
                        continue;
                    }

                    const cleanData = {
                        status: ['active', 'done'].includes(menfess.status) ? menfess.status : 'done',
                        last_message: menfess.last_message || new Date()
                    };
                    
                    await Database.updateMenfess(menfess.id, cleanData);
                }
            };

            switch (input) {
                case "user":
                    await processUsers();
                    break;
                case "group":
                    await processGroups();
                    break;
                case "menfess":
                    await processMenfess();
                    break;
                default:
                    return await ctx.reply(quote(`❎ Key "${input}" tidak valid!`));
            }

            return await ctx.editMessage(waitMsg.key, quote(`✅ Basis data berhasil dibersihkan untuk ${input}!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};