const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const groupHelper = require('../../database/groups');

module.exports = {
    name: "settext",
    aliases: ["settxt"],
    category: "group",
    handler: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const key = ctx.args[0];
        const text = ctx.args.slice(1).join(" ");

        if (!key && !text) return await ctx.reply(
            `${quote(`${tools.msg.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.msg.generateCommandExample(ctx._used, "welcome Selamat datang di grup!"))}\n` +
            quote(tools.msg.generateNotes([`Ketik ${monospace(`${ctx._used.prefix + ctx._used.command} list`)} untuk melihat daftar.`]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("settext");
            return await ctx.reply(listText);
        }

        try {
            const groupId = ctx.isGroup() ? ctx.id.split("@")[0] : null;
            let updateFunction;

            switch (key.toLowerCase()) {
                case "goodbye":
                    updateFunction = groupHelper.updateTextGoodbye;
                    break;
                case "intro":
                    updateFunction = groupHelper.updateTextIntro;
                    break;
                case "welcome":
                    updateFunction = groupHelper.updateTextWelcome;
                    break;
                default:
                    return await ctx.reply(quote(`❎ Key '${key}' tidak valid!`));
            }

            await updateFunction(groupId, text);
            return await ctx.reply(quote(`✅ Pesan untuk key '${key}' berhasil disimpan!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};