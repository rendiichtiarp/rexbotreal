const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");
const path = require("node:path");

module.exports = {
    name: "sfiledl",
    category: "downloader",
    permissions: {
        coin: 5
    },
    code: async (ctx) => {
        const url = ctx.args[0] || null;

        if (!url) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "https://example.com/"))
        );

        const isUrl = await tools.general.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

        try {
            const apiUrl = tools.api.createUrl("vapis", "/api/sfiledl", {
                url
            });
            const result = (await axios.get(apiUrl)).data.data;
            const fileName = path.basename(result.dl.split("&")[0]);
            const fileExtension = path.extname(fileName).slice(1);

            return await ctx.reply({
                document: {
                    url: result.download
                },
                caption: `${quote(`URL: ${url}`)}\n` +
                    "\n" +
                    config.msg.footer,
                fileName,
                mimetype: mime.lookup(fileExtension) || "application/octet-stream"
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};