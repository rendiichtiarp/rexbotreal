const { quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

module.exports = {
  name: "register",
  aliases: ["daftar", "reg", "regist", "verif", "verify"],
  category: "profile",
  permissions: {
    private: true,
  },
  code: async (ctx) => {
    try {
      ctx.reply(quote(`Pendaftaran RexbotX melalui:\n` +
        `https://www.rexbotx.biz.id\n\n` +
        `Cara pendaftaran:\n` +
        `1. Klik garis tiga di kanan atas\n` +
        `2. Pilih menu Daftar\n` +
        `3. Isi data Anda\n` +
        `4. Selamat, Anda sudah terdaftar di RexbotX`));
    } catch (error) {
      return await tools.cmd.handleError(ctx, error, false);
    }
  },
};
