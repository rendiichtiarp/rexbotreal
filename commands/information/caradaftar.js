const {
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");

module.exports = {
    name: "caradaftar",
    category: "information",

    code: async (ctx) => {

        let text = quote("Ketik .register NamaAnda Hari/Bulan/Tahun\n\n") +
            quote("Contoh: .register RexbotX 31/12/2009\n") +
            quote("✅ Gunakan nama asli Anda\n") +
            quote("✅ Umur minimal 7 tahun dan maksimal 42 tahun");

        return await ctx.reply({
            image: {
                url: "https://raw.githubusercontent.com/rendiichtiarp/RexbotX/refs/heads/main/contoh_register.png"
            },
            mimetype: mime.lookup("png"),
            caption: text
        });
    }
};

