const { monospace, quote } = require("@mengkodingan/ckptw");
const userHelper = require("../../database/users");

module.exports = {
  name: "buylimit",
  aliases: ["coin2limit", "c2l", "cointolimit"],
  category: "profile",
  desc: "Beli limit dengan coin (100 coin = 1 limit)",
  handler: {},
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    const senderId = ctx.sender.jid.split(/[:@]/)[0];
    const userDb = await userHelper.getUser(senderId);
    const amount = parseInt(ctx.args[0]) || 1;

    if (amount < 1) {
      return await ctx.reply(
        quote(
          `❎ Minimal beli 1 limit (100 coin)!\n\n`) +
            quote(`Penggunaan: ${monospace(
              `${ctx._used.prefix + ctx._used.command} <jumlah_limit>`
            )}`
        )
      );
    }

    const coinNeeded = amount * 100;
    if (userDb.coin < coinNeeded) {
      return await ctx.reply(
        quote(
          `❎ Coin tidak cukup! Dibutuhkan ${coinNeeded} coin untuk membeli ${amount} limit.\n`) +
            quote(`Coin kamu saat ini: ${userDb.coin}`)
      );
    }

    try {
      // Kurangi coin dan tambah limit
      await userHelper.convertCoinToLimit(senderId, amount);
      const updatedUser = await userHelper.getUser(senderId);

      return await ctx.reply(
        quote(
          `✅ Berhasil membeli ${amount} limit dengan ${coinNeeded} coin!\n\n`) +
            quote(
              `Sisa coin: ${updatedUser.coin}\n`) +
                quote(`Limit saat ini: ${updatedUser.user_limit}`)
      );
    } catch (error) {
      consolefy.error(`Error: ${error}`);
      return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
    }
  },
};
