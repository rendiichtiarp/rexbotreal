const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const {
    Sticker,
    StickerTypes
} = require("wa-sticker-formatter");

module.exports = {
    name: "quotlychat",
    aliases: ["qc", "quotly"],
    category: "maker",
    handler: {
        limit: [1, "text", 1],
        coin: [10, "text", 1]
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used.prefix + ctx._used.command, "get in the fucking robot, shinji!"))
        );

        if (input.length > 10000) return await ctx.reply(quote(`❎ Maksimal 50 kata!`));

        try {
            const profilePictureUrl = await ctx._client.profilePictureUrl(ctx.sender.jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

            const json = {
                "type": "quote",
                "format": "png",
                "backgroundColor": "#FFFFFF",
                "width": 512,
                "height": 768,
                "scale": 2,
                "messages": [
                    {
                        "entities": [],
                        "avatar": true,
                        "from": {
                            "id": 1,
                            "name": ctx.sender.pushName || "-",
                            "photo": {
                                "url": profilePictureUrl
                            }
                        },
                        "text": input,
                        "replyMessage": {}
                    }
                ]
            };

            const res = await axios.post('https://bot.lyo.su/quote/generate', json, {
                headers: {'Content-Type': 'application/json'}
            });
            const buffer = Buffer.from(res.data.result.image, 'base64');
            const rest = { 
                status: "200", 
                creator: "AdrianTzy",
                result: buffer
            };

            const sticker = new Sticker(rest.result, {
                pack: config.sticker.packname,
                author: config.sticker.author,
                type: StickerTypes.FULL,
                categories: ["🌕"],
                id: ctx.id,
                quality: 50
            });

            return await ctx.reply(await sticker.toMessage());
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};