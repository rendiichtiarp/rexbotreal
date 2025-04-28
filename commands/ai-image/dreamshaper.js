const {
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");
const axios = require("axios");

module.exports = {
    name: "dreamshaper",
    category: "ai-image",
    permissions: {
        coin: 15
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "moon"))
        );

        try {
            const apiUrl = tools.api.createUrl("nekorinn", "/ai-img/dreamshaper-xl", {
                text: input
            });
            const result = tools.general.getRandomElement((await axios.get(apiUrl)).data.result);

            return await ctx.reply({
                image: {
                    url: result
                },
                mimetype: mime.lookup("png"),
                caption: `${quote(`Prompt: ${input}`)}\n` +
                    "\n" +
                    config.msg.footer
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};