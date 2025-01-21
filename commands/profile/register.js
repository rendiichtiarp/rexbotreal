const { quote, monospace } = require("@mengkodingan/ckptw");

module.exports = {
  name: "register",
  aliases: ["daftar", "reg", "regist"],
  category: "profile",
  handler: {
    skipRegisterCheck: true,
  },
  code: async (ctx) => {
    if (await handler(ctx, module.exports.handler)) return;

    // Pisahkan tanggal lahir (elemen terakhir) dari nama
    const birthDate = ctx.args[ctx.args.length - 1];
    // Gabungkan semua elemen sebelum tanggal lahir sebagai nama
    const name = ctx.args.slice(0, -1).join(" ");

    if (!name || !birthDate) {
      return await ctx.reply(
        `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used, "John Doe 09/09/2009"))
      );
    }

    // Validasi nama minimal 3 karakter
    if (name.length < 3 || name.toLowerCase() === "john doe") {
      return await ctx.reply(
        quote(`❎ Nama terlalu pendek atau menggunakan nama contoh "John Doe". Gunakan nama lain.`)
      );
    }

    // Validasi format tanggal lahir
    const dateRegex =
      /^(0?[1-9]|[12][0-9]|3[01])[-\/\.](0?[1-9]|1[0-2])[-\/\.](\d{2}|\d{4})$/;
    // Mengizinkan format yang salah
    if (!dateRegex.test(birthDate)) {
      return await ctx.reply(
        quote(`❎ Format tanggal tidak sesuai.\n`) +
        quote(tools.msg.generateCommandExample(ctx._used, "John Doe 09/09/2009"))
      );
    }

    // Parse tanggal lahir
    const dateToParse = birthDate.replace(/[-\/\.]/g, "/"); // Ganti semua pemisah menjadi '/'
    const [, day, month, year] = dateToParse.match(dateRegex);

    // Jika tahun dua digit, ubah menjadi empat digit
    const fullYear = year.length === 2 ? `20${year}` : year; // Mengasumsikan tahun 2000-an untuk tahun dua digit

    // Format bulan dan hari menjadi dua digit
    const formattedDay = day.padStart(2, "0"); // Menambahkan nol di depan jika satu digit
    const formattedMonth = month.padStart(2, "0"); // Menambahkan nol di depan jika satu digit

    // Pemberitahuan jika format tanggal terbalik
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return await ctx.reply(
        quote(`❎ Format tanggal tidak sesuai. Gunakan Hari/Bulan/Tahun.\n`) +
        quote(tools.msg.generateCommandExample(ctx._used, "John Doe 09/09/2009"))
      );
    }

    const birthDateTime = new Date(fullYear, month - 1, day);
    const now = new Date();

    // Validasi tanggal yang valid
    if (birthDateTime > now || birthDateTime.toString() === "Invalid Date") {
      return await ctx.reply(
        quote(`❎ Format tanggal tidak sesuai.\n`) +
        quote(tools.msg.generateCommandExample(ctx._used, "John Doe 09/09/2009"))
      );
    }

    // Hitung umur
    const age = Math.floor(
      (now - birthDateTime) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Validasi rentang umur
    if (age < 5 || age > 42) {
      return await ctx.reply(
        quote(`❎ Umur tidak memenuhi syarat. Minimal 5 tahun dan maksimal 42 tahun.\n`) +
        quote(`Umur Anda: ${age} tahun.`)
      );
    }

    try {
      const userData = await db.get(`user.${ctx.sender.jid.split(/[:@]/)[0]}`);
      const isUpdate = userData && (userData.name || userData.birthDate);

      // Simpan data ke database
      await db.set(`user.${ctx.sender.jid.split(/[:@]/)[0]}`, {
        ...userData,
        name: name,
        birthDate: `${formattedDay}/${formattedMonth}/${fullYear}`,
        age: age,
        birthDateTime: birthDateTime.getTime(), // Simpan timestamp untuk perhitungan umur di masa depan
      });

      return await ctx.reply(
        quote(
          isUpdate
            ? `✅ Berhasil memperbarui data
- *Nama:* ${name}
- *Tanggal Lahir:* ${formattedDay}/${formattedMonth}/${fullYear}
- *Umur:* ${age} tahun\n` 
+
config.msg.footer
            : `✅ Pendaftaran berhasil
- *Nama:* ${name}
- *Tanggal Lahir:* ${formattedDay}/${formattedMonth}/${fullYear}
- *Umur:* ${age} tahun\n` 
+
config.msg.footer
        )
      );
    } catch (error) {
      console.error(`[${config.pkg.name}] Error:`, error);
      return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
    }
  },
};
