const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "otagall",
    category: "owner",
    permissions: {
        group: true,
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || quote("👋 Halo, Dunia!");

        try {
            const members = await ctx.group().members();
            const mentions = members.map(m => {
                const serialized = tools.general.getID(m.id);
                return {
                    tag: `@${serialized}`,
                    mention: m.id
                };
            });

            const resultText = mentions.map(m => m.tag).join(" ");
            return await ctx.reply({
                text: `${input}\n` +
                    `${config.msg.readmore}─────\n` +
                    resultText,
                mentions: mentions.map(m => m.mention)
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};