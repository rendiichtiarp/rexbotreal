const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "join",
    aliases: ["j"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const url = ctx.args[0] || null;

        if (!url) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used, "https://example.com/"))
        );

        const isUrl = await tools.general.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

        try {
            const urlCode = new URL(url).pathname.split("/").pop();
            const res = await ctx.groups.acceptInvite(urlCode);

            await ctx.sendMessage(res, {
                text: quote(`👋 Halo! Aku adalah Bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${config.owner.name}. Saya bisa melakukan banyak perintah, seperti membuat stiker, menggunakan AI, dan beberapa perintah berguna lainnya.\nGunakan .menu untuk melihat perintah!`)
            });

            return await ctx.reply(quote(`✅ Berhasil bergabung dengan grup!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};