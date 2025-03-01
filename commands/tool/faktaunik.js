const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
    name: "faktaunik",
    aliases: ["fakta", "tahukahanda"],
    category: "tool",
    permissions: {
        coin: 5
    },
    code: async (ctx) => {
        const apiUrl = tools.api.createUrl("https://cinnabar.icaksh.my.id", "/public/daily/tawiki");

        try {
            // Mengambil data dari API
            const response = await axios.get(apiUrl);
            const data = response.data.data;
            
            // Memilih fakta secara acak dari array info
            const randomFact = tools.general.getRandomElement(data.info);

            // Mengirim pesan dengan format yang sesuai
            return await ctx.reply({
                image: {
                    url: randomFact.image_link
                },
                text: quote(`Tahukah Anda? ${randomFact.tahukah_anda}`)
            });
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};