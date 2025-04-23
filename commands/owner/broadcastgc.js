const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "broadcastgc",
    aliases: ["bcgc"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || ctx.quoted?.conversation || Object.values(ctx.quoted).map(v => v?.text || v?.caption).find(Boolean) || null;
        const msgType = ctx.getMessageType();
        const [checkMedia, checkQuotedMedia] = await Promise.all([
            tools.cmd.checkMedia(msgType, "image"),
            tools.cmd.checkQuotedMedia(ctx.quoted, "image")
        ]);

        if (!input && !checkMedia && !checkQuotedMedia) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text", "image"]))}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "halo, dunia!"))}\n` +
             quote(tools.cmd.generateNotes(["Untuk teks satu baris, ketik saja langsung ke perintah. Untuk teks dengan baris baru, balas pesan yang berisi teks tersebut ke perintah."]))
        );

        try {
            const delay = ms => new Promise(res => setTimeout(res, ms));
            const getRandomDelay = () => Math.floor(Math.random() * (5000 - 2000 + 1) + 2000); // Random 2-5 detik
            const groupData = await ctx.core.groupFetchAllParticipating();
            const groupIds = Object.values(groupData).map(g => g.id);

            const waitMsg = await ctx.reply(quote(`🔄 Mengirim siaran ke ${groupIds.length} grup, perkiraan waktu: ${((groupIds.length * 3.5) / 60).toFixed(2)} menit.`));

            const failedGroupIds = [];
            let imageUrl = null;

            if (checkMedia || checkQuotedMedia) {
                const buffer = await ctx.msg.media?.toBuffer() || await ctx.quoted.media?.toBuffer();
                imageUrl = await tools.general.upload(buffer, "image");
            }

            for (const groupId of groupIds) {
                const randomDelay = getRandomDelay();
                await delay(randomDelay);
                try {
                    const fakeQuotedText = {
                        key: {
                            fromMe: false,
                            participant: "13135550002@s.whatsapp.net",
                            remoteJid: "status@broadcast"
                        },
                        message: {
                            extendedTextMessage: {
                                text: config.msg.note,
                                title: config.bot.name,
                                thumbnailUrl: config.bot.thumbnail
                            }
                        }
                    };

                    if (imageUrl) {
                        await ctx.sendMessage(groupId, {
                            image: { url: imageUrl },
                            caption: input || "",
                            quoted: fakeQuotedText
                        });
                    } else {
                        await ctx.sendMessage(groupId, {
                            text: input
                        }, {
                            quoted: fakeQuotedText
                        });
                    }
                } catch (error) {
                    consolefy.error(`Error: ${error}`);
                    failedGroupIds.push(groupId);
                }
            }

            const successCount = groupIds.length - failedGroupIds.length;
            return await ctx.editMessage(waitMsg.key, quote(`✅ Berhasil mengirim ke ${successCount} grup. Gagal mengirim ke ${failedGroupIds.length} grup.`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};