const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

module.exports = {
    name: "pinterest",
    aliases: ["pin", "pint"],
    category: "tool",
    permissions: {
        coin: 5
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "moon"))
        );

        try {
            const apiUrl = tools.api.createUrl("archive", "api/search/pinterest");
            const response = await axios.get(apiUrl, {
                    params: {
                        query: input
                    }
                });

            const randomResult = tools.general.getRandomElement(response.data.result);

            return await ctx.reply({
                image: {
                    url: randomResult.image
                },
                mimetype: mime.lookup("png"),
                caption: `${quote(`Query: ${input}`)}\n` +
                    `${quote(`Caption: ${randomResult.caption || 'Tidak ada caption'}`)}\n` +
                    `${quote(`Uploader: ${randomResult.fullname} (@${randomResult.upload_by})`)}\n` +
                    `${quote(`Source: ${randomResult.source}`)}\n` +
                    "\n" +
                    config.msg.footer
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};