const {
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");

module.exports = {
    name: "makequote",
    aliases: ["makequote", "makequotes", "buatquote", "buatquotes"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "evangelion itu peak!"))
        );

        if (input.length > 10000) return await ctx.reply(quote(`❎ Maksimal 10000 kata!`));

        try {
            const senderJid = ctx.sender.jid;
            const profilePictureUrl = await ctx.core.profilePictureUrl(senderJid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");
            const apiUrl = tools.api.createUrl("fast", "/maker/quote", {
                text: input,
                username: `${ctx.sender.pushName}`,
                ppUrl: profilePictureUrl,
                signature: "RexbotX"
            });

            return await ctx.reply({
                image: {
                    url: apiUrl
                },
                mimetype: mime.lookup("png")
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};