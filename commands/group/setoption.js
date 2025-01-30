const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const groupHelper = require('../../database/groups');

module.exports = {
    name: "setoption",
    aliases: ["setopt"],
    category: "group",
    handler: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(`${tools.msg.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.msg.generateCommandExample(ctx._used, "antilink"))}\n` +
            quote(tools.msg.generateNotes([`Ketik ${monospace(`${ctx._used.prefix + ctx._used.command} list`)} untuk melihat daftar.`, `Ketik ${monospace(`${ctx._used.prefix + ctx._used.command} status`)} untuk melihat status.`]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("setoption");
            return await ctx.reply(listText);
        }

        if (ctx.args[0] === "status") {
            const groupId = ctx.isGroup() ? ctx.id.split("@")[0] : null;
            const groupDb = await groupHelper.getGroup(groupId);

            return await ctx.reply(
                `${quote(`Antilink: ${groupDb?.antilink ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antinsfw: ${groupDb?.antinsfw ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antisticker: ${groupDb?.antisticker ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Antitoxic: ${groupDb?.antitoxic ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Autokick: ${groupDb?.autokick ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Welcome: ${groupDb?.welcome ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Shalat: ${groupDb?.shalat ? "Aktif" : "Nonaktif"}`)}\n` +
                `${quote(`Intro: ${groupDb?.intro ? "Aktif" : "Nonaktif"}`)}\n` +
                "\n" +
                config.msg.footer
            );
        }

        try {
            const groupId = ctx.isGroup() ? ctx.id.split("@")[0] : null;
            let updateFunction;
            let optionName;
            let textKey;

            switch (input.toLowerCase()) {
                case "antilink":
                    updateFunction = groupHelper.updateAntilink;
                    optionName = "antilink";
                    break;
                case "antinsfw":
                    updateFunction = groupHelper.updateAntinsfw;
                    optionName = "antinsfw";
                    break;
                case "antisticker":
                    updateFunction = groupHelper.updateAntisticker;
                    optionName = "antisticker";
                    break;
                case "antitoxic":
                    updateFunction = groupHelper.updateAntitoxic;
                    optionName = "antitoxic";
                    break;
                case "autokick":
                    updateFunction = groupHelper.updateAutokick;
                    optionName = "autokick";
                    break;
                case "welcome":
                    updateFunction = groupHelper.updateWelcome;
                    optionName = "welcome";
                    break;
                case "shalat":
                    updateFunction = groupHelper.updateShalat;
                    optionName = "shalat";
                    break;
                case "intro":
                    updateFunction = groupHelper.updateIntro;
                    textKey = "intro";
                    break;
                default:
                    return await ctx.reply(quote(`❎ Key '${input}' tidak valid!`));
            }

            const groupDb = await groupHelper.getGroup(groupId);
            const currentStatus = groupDb?.[optionName] || false;
            const newStatus = !currentStatus;

            await updateFunction(groupId, newStatus);

            const statusText = newStatus ? "diaktifkan" : "dinonaktifkan";
            return await ctx.reply(quote(`✅ Fitur '${input}' berhasil ${statusText}!`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};