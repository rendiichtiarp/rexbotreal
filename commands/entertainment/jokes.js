const { quote } = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
  name: "jokes",
  category: "entertainment",
  handler: {
    limit: 1,
  },
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    const apiUrl = tools.api.createUrl(
      "https://candaan-api.vercel.app",
      "/api/text/random",
      {}
    );

    try {
      const { data } = await axios.get(apiUrl);
      return await ctx.reply(data.data);
    } catch (error) {
      consolefy.error(`Error: ${error}`);
      if (error.response && error.response.status !== 200) {
        return await ctx.reply(config.msg.notFound);
      }
      return ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
    }
  },
};
