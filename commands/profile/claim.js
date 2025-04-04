const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");


module.exports = {
    name: "claim",
    category: "profile",
    permissions: {},
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "daily"))}\n` +
            quote(tools.cmd.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`]))
        );

        const senderId = tools.general.getID(ctx.sender.jid);
        const userDb = await Database.getUser(senderId);

        if (input === "list") {
            const listText = await tools.list.get("claim");
            return await ctx.reply(listText);
        }

        if (!claimRewards[input]) return await ctx.reply(quote(`❎ Hadiah tidak valid!`));

        if (tools.general.isOwner(senderId) && userDb?.premium) return await ctx.reply(quote("❎ Anda sudah memiliki koin tak terbatas, tidak perlu mengklaim lagi."));

        const requiredLevel = claimRewards[input].level || 0;
        if (userDb?.level < requiredLevel) return await ctx.reply(quote(`❎ Anda perlu mencapai level ${requiredLevel} untuk mengklaim hadiah ini. Level Anda saat ini adalah ${userDb?.level || 0}.`));

        // Cek waktu klaim terakhir berdasarkan tipe
        const lastClaimField = `last_claim_${input}`;
        const lastClaimTime = userDb?.[lastClaimField] || 0;
        const currentTime = Date.now();
        const timePassed = currentTime - lastClaimTime;
        const remainingTime = claimRewards[input].cooldown - timePassed;

        if (remainingTime > 0) return await ctx.reply(quote(`⏳ Anda telah mengklaim hadiah ${input}. Tunggu ${tools.general.convertMsToDuration(remainingTime)} untuk mengklaim lagi.`));

        try {
            const rewardCoin = (userDb?.coin || 0) + claimRewards[input].reward;
            
            // Update koin dan waktu klaim terakhir
            await Database.updateUser(senderId, {
                coin: rewardCoin,
                [lastClaimField]: currentTime
            });

            return await ctx.reply(quote(`✅ Anda berhasil mengklaim hadiah ${input} sebesar ${claimRewards[input].reward} koin! Koin saat ini: ${rewardCoin}.`));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};

// Daftar hadiah klaim yang tersedia
const claimRewards = {
    daily: {
        reward: 50,         // Dari 100 menjadi 50 coin
        cooldown: 24 * 60 * 60 * 1000, // 24 jam
        level: 1 // Level 1 untuk klaim daily
    },
    weekly: {
        reward: 250,        // Dari 500 menjadi 250 coin
        cooldown: 7 * 24 * 60 * 60 * 1000, // 7 hari
        level: 15 // Level 15 untuk klaim weekly
    },
    monthly: {
        reward: 1000,       // Dari 2000 menjadi 1000 coin
        cooldown: 30 * 24 * 60 * 60 * 1000, // 30 hari
        level: 50 // Level 50 untuk klaim monthly
    },
    yearly: {
        reward: 5000,       // Dari 10000 menjadi 5000 coin
        cooldown: 365 * 24 * 60 * 60 * 1000, // 365 hari
        level: 75 // Level 75 untuk klaim yearly
    }
};