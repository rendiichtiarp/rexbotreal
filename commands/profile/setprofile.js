const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const userHelper = require('../../database/users');

module.exports = {
    name: "setprofile",
    aliases: ["set", "setp", "setprof"],
    category: "profile",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(`${tools.msg.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.msg.generateCommandExample(ctx._used, "autolevelup"))}\n` +
            quote(tools.msg.generateNotes([`Ketik ${monospace(`${ctx._used.prefix + ctx._used.command} list`)} untuk melihat daftar.`]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("setprofile");
            return await ctx.reply(listText);
        }

        try {
            const senderId = ctx.sender.jid.split(/[:@]/)[0];
            const userData = await userHelper.getUser(senderId);

            switch (input.toLowerCase()) {
                case "autolevelup":
                    const newStatus = !userData.autolevelup;
                    await userHelper.setAutoLevelup(senderId, newStatus);
                    const statusText = newStatus ? "diaktifkan" : "dinonaktifkan";
                    return await ctx.reply(quote(`✅ Fitur '${input}' berhasil ${statusText}!`));
                    break;
                default:
                    return await ctx.reply(quote(`❎ Teks tidak valid.`));
            }
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};