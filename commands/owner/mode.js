const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const botHelper = require('../../database/bot');

module.exports = {
    name: "mode",
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(`${tools.msg.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.msg.generateCommandExample(ctx._used, "self"))}\n` +
            quote(tools.msg.generateNotes([`Ketik ${monospace(`${ctx._used.prefix + ctx._used.command} list`)} untuk melihat daftar.`]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("mode");
            return await ctx.reply(listText);
        }

        try {
            switch (input.toLowerCase()) {
                case "group":
                    await botHelper.setSetting("bot.mode", "group");
                    break;
                case "private":
                    await botHelper.setSetting("bot.mode", "private");
                    break;
                case "public":
                    await botHelper.setSetting("bot.mode", "public");
                    break;
                case "self":
                    await botHelper.setSetting("bot.mode", "self");
                    break;
                default:
                    return await ctx.reply(quote(`❎ Teks tidak valid.`));
            }

            return await ctx.reply(quote(`✅ Berhasil mengubah mode ke ${input}!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};