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

    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    if (!name || !birthDate) {
      return await ctx.reply(
        `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used, `NamaAnda ${formattedToday}`)) + 
            `\n` + quote(`Mohon pastikan tanggal lahir Anda berada di samping nama Anda, bukan di bawah!`)
      );
    }

    // Validasi nama minimal 3 karakter
    if (name.length < 3 || name.toLowerCase() === "NamaAnda") {
      return await ctx.reply(
        quote(`❎ Nama yang Anda masukkan terlalu pendek atau menggunakan nama contoh. Mohon gunakan nama asli Anda.`)
      );
    }

    // Pengecekan untuk karakter khusus dalam nama
    const specialCharRegex = /[^a-zA-Z0-9\s]/; // Mengizinkan hanya huruf, angka, dan spasi
    if (specialCharRegex.test(name)) {
      return await ctx.reply(
        quote(`❎ Nama tidak boleh mengandung karakter khusus. Mohon periksa kembali.`)
      );
    }

    // Validasi format tanggal lahir
    const dateRegex =
      /^(0?[1-9]|[12][0-9]|3[01])[-\/\.](0?[1-9]|1[0-2])[-\/\.](\d{2}|\d{4})$/;
    // Mengizinkan format yang salah
    if (!dateRegex.test(birthDate)) {
      return await ctx.reply(
        quote(`❎ Format tanggal yang Anda masukkan tidak sesuai.\n`) +
        quote(tools.msg.generateCommandExample(ctx._used, `NamaAnda ${formattedToday}`))
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

    const birthDateTime = new Date(fullYear, month - 1, day);
    const now = new Date();

    // Validasi tanggal yang valid
    if (birthDateTime > now || birthDateTime.toString() === "Invalid Date") {
      return await ctx.reply(
        quote(`❎ Format tanggal tidak sesuai.\n`) +
        quote(tools.msg.generateCommandExample(ctx._used, `NamaAnda ${formattedToday}`))
      );
    }

    // Hitung umur
    const age = Math.floor(
      (now - birthDateTime) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Validasi rentang umur
    if (age < 5 || age > 42) {
      return await ctx.reply(
        quote(`❎ Umur yang Anda masukkan tidak memenuhi syarat. Minimal 5 tahun dan maksimal 42 tahun.\n`) +
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
            ? `✅ Data Anda berhasil diperbarui
- *Nama:* ${name}
- *Tanggal Lahir:* ${formattedDay}/${formattedMonth}/${fullYear}
- *Umur:* ${age} tahun\n` 
+
config.msg.footer
            : `✅ Pendaftaran Anda berhasil
- *Nama:* ${name}
- *Tanggal Lahir:* ${formattedDay}/${formattedMonth}/${fullYear}
- *Umur:* ${age} tahun\n` 
+
config.msg.footer
        )
      );
    } catch (error) {
      consolefy.error(`Error: ${error}`);
      return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
    }
  },
};
