const {
    quote,
    monospace
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "register",
    aliases: ["daftar"],
    category: "profile",
    handler: {
        skipRegisterCheck: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        // Pisahkan tanggal lahir (elemen terakhir) dari nama
        const birthDate = ctx.args[ctx.args.length - 1];
        // Gabungkan semua elemen sebelum tanggal lahir sebagai nama
        const name = ctx.args.slice(0, -1).join(" ");

        if (!name || !birthDate) {
            return await ctx.reply(quote(`📝 Pendaftaran Pengguna

Mohon masukkan nama dan tanggal lahir
dengan format yang benar

Format:
${monospace(`${ctx._used.prefix + ctx._used.command}`)} Nama dd/mm/yyyy

Contoh:
${monospace(`${ctx._used.prefix + ctx._used.command}`)} John Doe 15/08/2000`));
        }

        // Validasi nama minimal 3 karakter
        if (name.length < 3) {
            return await ctx.reply(quote(`❌ Validasi Gagal

• Nama terlalu pendek
• Minimal 3 karakter untuk nama lengkap
• Silakan coba lagi`));
        }

        // Validasi format tanggal lahir
        const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})$/;
        if (!dateRegex.test(birthDate)) {
            return await ctx.reply(quote(`❌ Format Tanggal Invalid

• Gunakan format: dd/mm/yyyy
• Contoh: *15/08/2000*`));
        }

        // Parse tanggal lahir
        const [, day, month, year] = birthDate.match(dateRegex);
        const birthDateTime = new Date(year, month - 1, day);
        const now = new Date();

        // Validasi tanggal yang valid
        if (birthDateTime > now || birthDateTime.toString() === 'Invalid Date') {
            return await ctx.reply(quote(`❌ Tanggal Invalid

• Tanggal lahir tidak valid
• Mohon masukkan tanggal yang benar`));
        }

        // Hitung umur
        const age = Math.floor((now - birthDateTime) / (365.25 * 24 * 60 * 60 * 1000));
        
        // Validasi rentang umur
        if (age < 5 || age > 100) {
            return await ctx.reply(quote(`❌ Validasi Umur

• *Umur Anda:* ${age} tahun
• Tidak memenuhi syarat
• *Rentang umur yang valid:* 5-100 tahun`));
        }

        try {
            const userData = await db.get(`user.${ctx.sender.jid.split(/[:@]/)[0]}`);
            const isUpdate = userData && (userData.name || userData.birthDate);
            
            // Simpan data ke database
            await db.set(`user.${ctx.sender.jid.split(/[:@]/)[0]}`, {
                ...userData,
                name: name,
                birthDate: birthDate,
                age: age,
                birthDateTime: birthDateTime.getTime() // Simpan timestamp untuk perhitungan umur di masa depan
            });

            return await ctx.reply(quote(
                isUpdate 
                    ? `✅ Data Berhasil Diperbarui

• *Nama:* ${name}
• *Tanggal Lahir:* ${birthDate}
• *Umur:* ${age} tahun

Terima kasih telah memperbarui data!`
                    : `✅ Pendaftaran Berhasil

• *Nama:* ${name}
• *Tanggal Lahir:* ${birthDate}
• *Umur:* ${age} tahun

Selamat bergabung!`
            ));
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};