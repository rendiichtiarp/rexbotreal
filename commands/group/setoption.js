const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "setoption",
    aliases: ["setopt"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(`${tools.cmd.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "antilink"))}\n` +
            quote(tools.cmd.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`, `Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} status`)} untuk melihat status.`]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("setoption");
            return await ctx.reply(listText);
        }

        if (ctx.args[0] === "status") {
            const groupId = ctx.isGroup() ? tools.general.getID(ctx.id) : null;
            const group = await Database.getGroup(groupId);

            return await ctx.reply(
                `${quote(`Antilink: ${group?.antilink ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antinsfw: ${group?.antinsfw ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antispam: ${group?.antispam ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antisticker: ${group?.antisticker ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antitoxic: ${group?.antitoxic ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Autokick: ${group?.autokick ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Welcome: ${group?.welcome ? "Aktif" : "Nonaktif"}`)}\n` +
                "\n" +
                config.msg.footer
            );
        }

        try {
            const groupId = ctx.isGroup() ? tools.general.getID(ctx.id) : null;
            const group = await Database.getGroup(groupId);
            
            switch (input.toLowerCase()) {
                case "antilink":
                case "antinsfw":
                case "antispam":
                case "antisticker":
                case "antitoxic":
                case "autokick":
                case "welcome":
                    // Toggle nilai boolean
                    await Database.updateGroup(groupId, {
                        [input.toLowerCase()]: !group?.[input.toLowerCase()]
                    });
                    break;
                default:
                    return await ctx.reply(quote(`❎ Key '${input}' tidak valid!`));
            }

            const statusText = !group?.[input.toLowerCase()] ? "diaktifkan" : "dinonaktifkan";
            return await ctx.reply(quote(`✅ Fitur '${input}' berhasil ${statusText}!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};