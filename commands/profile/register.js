const { 
    quote 
} = require("@mengkodingan/ckptw");
const Database = require('../../lib/database/queries');

module.exports = {
    name: "register",
    aliases: ["daftar", "reg", "regist", "verif", "verify"],
    category: "profile",
    permissions: {
        private: true
    },
    code: async (ctx) => {
        // Pisahkan tanggal lahir (elemen terakhir) dari nama
        const birthDate = ctx.args[ctx.args.length - 1];
        // Gabungkan semua elemen sebelum tanggal lahir sebagai nama
        const name = ctx.args.slice(0, -1).join(" ");

        const today = new Date();
        const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        if (!name || !birthDate) {
            return await ctx.reply(
                `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                quote(tools.msg.generateCommandExample(ctx.used, `NamaAnda ${formattedToday}`))
            );
        }

        // Validasi nama minimal 3 karakter
        if (name.length < 3 || ["namaanda", "rexbotx"].includes(name.toLowerCase())) {
            return await ctx.reply(quote(`❎ Nama terlalu pendek atau menggunakan nama contoh. Gunakan nama asli Anda.`));
        }

        // Pengecekan untuk karakter khusus dalam nama
        const specialCharRegex = /[^a-zA-Z\s]/; // Hanya izinkan huruf dan spasi
        if (specialCharRegex.test(name)) {
            return await ctx.reply(quote(`❎ Nama hanya boleh menggunakan huruf dan spasi.`));
        }

        // Validasi format tanggal lahir (HH/BB/TTTT)
        const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})$/;
        if (!dateRegex.test(birthDate)) {
            return await ctx.reply(quote(`❎ Format tanggal tidak sesuai. Gunakan format: HH/BB/TTTT`));
        }

        // Parse tanggal lahir
        const [, day, month, year] = birthDate.match(dateRegex);
        const birthDateTime = new Date(year, month - 1, day);
        const now = new Date();

        // Validasi tanggal yang valid
        if (birthDateTime > now || birthDateTime.toString() === "Invalid Date") {
            return await ctx.reply(quote(`❎ Tanggal lahir tidak valid.`));
        }

        // Hitung umur
        const age = Math.floor((now - birthDateTime) / (365.25 * 24 * 60 * 60 * 1000));

        // Validasi rentang umur
        if (age < 7 || age > 42) {
            return await ctx.reply(quote(`❎ Umur harus antara 7-42 tahun. Umur Anda: ${age} tahun.`));
        }

        try {
            const senderId = tools.general.getID(ctx.sender.jid);
            const userDb = await Database.getUser(senderId);
            const isUpdate = userDb && (userDb.name || userDb.birth_date);

            // Format tanggal untuk MySQL (YYYY-MM-DD)
            const mysqlDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            // Update data user
            await Database.updateUser(senderId, {
                name: name,
                birth_date: mysqlDate,
                birth_date_time: birthDateTime.getTime(),
                age: age,
                registered: true
            });

            return await ctx.reply(quote(
                `✅ ${isUpdate ? 'Data berhasil diperbarui' : 'Pendaftaran berhasil'}!\n\n` +
                `> Nama: ${name}\n` +
                `> Tanggal Lahir: ${day}/${month}/${year}\n` +
                `> Umur: ${age} tahun`
            ));
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
