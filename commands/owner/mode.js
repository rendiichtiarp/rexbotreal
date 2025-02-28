const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "mode",
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(`${tools.msg.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.msg.generateCommandExample(ctx.used, "self"))}\n` +
            quote(tools.msg.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("mode");
            return await ctx.reply(listText);
        }

        try {
            const validModes = ["group", "private", "public", "self"];
            const mode = input.toLowerCase();

            if (!validModes.includes(mode)) {
                return await ctx.reply(quote(`❎ Mode tidak valid.`));
            }

            // Update mode bot di database
            await Database.updateBotMode(mode);
            return await ctx.reply(quote(`✅ Berhasil mengubah mode ke ${mode}!`));

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};