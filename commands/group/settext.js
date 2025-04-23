const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "settext",
    aliases: ["settxt"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const key = ctx.args[0];
        const text = ctx.args.slice(1).join(" ") || ctx.quoted?.conversation || Object.values(ctx.quoted).map(v => v?.text || v?.caption).find(Boolean)

        if (!key && !text) return await ctx.reply(
            `${quote(`${tools.cmd.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "welcome Selamat datang di grup!"))}\n` +
            quote(tools.cmd.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`, "Untuk teks satu baris, ketik saja langsung ke perintah. Untuk teks dengan baris baru, balas pesan yang berisi teks tersebut ke perintah."]))
        );

        if (ctx.args[0] === "list") {
            const listText = await tools.list.get("settext");
            return await ctx.reply(listText);
        }

        try {
            const groupId = ctx.isGroup() ? tools.general.getID(ctx.id) : null;
            const validKeys = ["welcome", "goodbye", "intro"];
            const keyLower = key.toLowerCase();

            if (!validKeys.includes(keyLower)) {
                return await ctx.reply(quote(`❎ Key '${key}' tidak valid!`));
            }

            // Update text settings grup di database
            await Database.updateGroup(groupId, {
                [`${keyLower}_text`]: text
            });

            return await ctx.reply(quote(`✅ Pesan untuk key '${key}' berhasil disimpan!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};