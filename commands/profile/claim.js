const { monospace, quote } = require("@mengkodingan/ckptw");
const userHelper = require("../../database/users");

module.exports = {
  name: "claim",
  category: "profile",
  handler: {},
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    const input = ctx.args.join(" ") || null;

    if (!input)
      return await ctx.reply(
        `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
          `${quote(tools.msg.generateCommandExample(ctx._used, "daily"))}\n` +
          quote(
            tools.msg.generateNotes([
              `Ketik ${monospace(
                `${ctx._used.prefix + ctx._used.command} list`
              )} untuk melihat daftar.`,
            ])
          )
      );

    const senderId = ctx.sender.jid.split(/[:@]/)[0];
    const userDb = await userHelper.getUser(senderId);
    const isOwner = tools.general.isOwner(senderId);

    if (input === "list") {
      const listText = await tools.list.get("claim");
      return await ctx.reply(listText);
    }

    if (!claimRewards[input])
      return await ctx.reply(quote(`❎ Hadiah tidak valid!`));

    const requiredLevel = claimRewards[input].level || 0;
    if (userDb?.level < requiredLevel)
      return await ctx.reply(
        quote(
          `❎ Anda perlu mencapai level ${requiredLevel} untuk mengklaim hadiah ini. Level Anda saat ini adalah ${
            userDb?.level || 0
          }.`
        )
      );

    const lastClaimTime = await userHelper.getLastClaim(senderId, input);
    const currentTime = Date.now();
    const timePassed = currentTime - lastClaimTime;
    const remainingTime = claimRewards[input].cooldown - timePassed;

    if (remainingTime > 0)
      return await ctx.reply(
        quote(
          `⏳ Anda telah mengklaim hadiah ${input}. Tunggu ${tools.general.convertMsToDuration(
            remainingTime
          )} untuk mengklaim lagi.`
        )
      );

    if (isOwner && userDb?.premium)
      return await ctx.reply(
        quote(
          "❎ Anda sudah memiliki koin tak terbatas, tidak perlu mengklaim lagi."
        )
      );

    try {
      await userHelper.claimReward(senderId, input, claimRewards[input].reward);
      const updatedUser = await userHelper.getUser(senderId);

      const isLimitClaim = input === "limit";
      const rewardType = isLimitClaim ? "limit" : "koin";
      const currentAmount = isLimitClaim
        ? updatedUser.user_limit
        : updatedUser.coin;

      return await ctx.reply(
        quote(
          `✅ Anda berhasil mengklaim hadiah ${input} sebesar ${claimRewards[input].reward} ${rewardType}!\n`
        ) + quote(`${rewardType} saat ini: ${currentAmount}`)
      );
    } catch (error) {
      consolefy.error(`Error: ${error}`);
      return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
    }
  },
};

// Daftar hadiah klaim yang tersedia (Dapat diubah sesuai keinginan Anda)
const claimRewards = {
  daily: {
    reward: 100,
    cooldown: 24 * 60 * 60 * 1000, // 24 jam (100 koin)
    level: 1, // Level 1 untuk klaim daily
  },
  weekly: {
    reward: 500,
    cooldown: 7 * 24 * 60 * 60 * 1000, // 7 hari (500 koin)
    level: 15, // Level 15 untuk klaim weekly
  },
  monthly: {
    reward: 2000,
    cooldown: 30 * 24 * 60 * 60 * 1000, // 30 hari (2000 koin)
    level: 50, // Level 50 untuk klaim monthly
  },
  yearly: {
    reward: 10000,
    cooldown: 365 * 24 * 60 * 60 * 1000, // 365 hari (10000 koin)
    level: 75, // Level 75 untuk klaim yearly
  },
  limit: {
    reward: 15, // 15 limit per hari
    cooldown: 24 * 60 * 60 * 1000, // 24 jam
    level: 1, // Level 1 untuk klaim limit
  },
};
