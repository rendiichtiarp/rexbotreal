const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
    
module.exports = {
    name: "setprofile",
    aliases: ["set", "setp", "setprof"],
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(`${tools.cmd.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "autolevelup"))}\n` +
            quote(tools.cmd.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`]))
        );

         if (input === "list") {
            const listText = await tools.list.get("setprofile");
            return await ctx.reply(listText);
        }

        try {
            const senderId = tools.general.getID(ctx.sender.jid);
            const userDb = await Database.getUser(senderId);

            switch (input.toLowerCase()) {
                case "autolevelup":
                    const newStatus = !(userDb?.autolevelup || false);
                    await Database.updateUser(senderId, {
                        autolevelup: newStatus
                    });
                    const statusText = newStatus ? "diaktifkan" : "dinonaktifkan";
                    return await ctx.reply(quote(`✅ Fitur '${input}' berhasil ${statusText}!`));
                default:
                    return await ctx.reply(quote(`❎ Teks tidak valid.`));
            }
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};