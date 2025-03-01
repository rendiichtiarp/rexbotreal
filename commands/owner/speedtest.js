const { quote } = require('@mengkodingan/ckptw');
const axios = require('axios');

module.exports = {
    name: "speedtest",
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            const msg = await ctx.reply(quote(`📊 *SPEEDTEST*\n\nMenjalankan speedtest...\nMohon tunggu sekitar 30 detik.`));
            
            // Fungsi untuk mengukur ping
            async function measurePing(attempts = 5) {
                let total = 0;
                for (let i = 0; i < attempts; i++) {
                    const start = Date.now();
                    await axios.get('https://speed.cloudflare.com/__down', { timeout: 5000 });
                    total += Date.now() - start;
                }
                return Math.round(total / attempts);
            }

            // Fungsi untuk mengukur download speed
            async function measureDownload(attempts = 3) {
                let speeds = [];
                const sizes = [1000000, 2000000, 5000000, 10000000, 25000000]; // 1MB to 25MB

                for (const bytes of sizes) {
                    const start = Date.now();
                    await axios.get(`https://speed.cloudflare.com/__down?bytes=${bytes}`, {
                        timeout: 15000,
                        responseType: 'arraybuffer'
                    });
                    const duration = (Date.now() - start) / 1000;
                    speeds.push((bytes * 8) / duration / 1000000);
                    
                    // Berikan waktu jeda
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Hilangkan nilai tertinggi dan terendah, ambil rata-rata
                speeds.sort((a, b) => a - b);
                speeds = speeds.slice(1, -1);
                return (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2);
            }

            // Fungsi untuk mengukur upload speed
            async function measureUpload(attempts = 3) {
                let speeds = [];
                const sizes = [1000000, 2000000, 5000000]; // 1MB to 5MB

                for (const bytes of sizes) {
                    const data = Buffer.alloc(bytes);
                    const start = Date.now();
                    await axios.post('https://speed.cloudflare.com/__up', data, {
                        timeout: 15000,
                        headers: { 'Content-Type': 'application/octet-stream' }
                    });
                    const duration = (Date.now() - start) / 1000;
                    speeds.push((bytes * 8) / duration / 1000000);
                    
                    // Berikan waktu jeda
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Hilangkan nilai tertinggi dan terendah, ambil rata-rata
                speeds.sort((a, b) => a - b);
                speeds = speeds.slice(1, -1);
                return (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2);
            }

            // Jalankan test
            const ping = await measurePing();
            await ctx.editMessage(msg.key, quote(`📊 *SPEEDTEST*\n\nMengukur download speed...`));
            const downloadSpeed = await measureDownload();
            await ctx.editMessage(msg.key, quote(`📊 *SPEEDTEST*\n\nMengukur upload speed...`));
            const uploadSpeed = await measureUpload();

            // Fungsi untuk menentukan kualitas koneksi
            function getQuality(speed) {
                if (speed >= 100) return "Sangat Baik ⭐⭐⭐⭐⭐";
                if (speed >= 50) return "Baik ⭐⭐⭐⭐";
                if (speed >= 25) return "Cukup ⭐⭐⭐";
                if (speed >= 10) return "Sedang ⭐⭐";
                return "Kurang ⭐";
            }

            const output = [
                `📊 *SPEEDTEST RESULTS*`,
                ``,
                `🌐 *Server Information*`,
                `◦ Provider: Cloudflare Speed Test`,
                `◦ Location: Global CDN`,
                ``,
                `📡 *Connection Details*`,
                `◦ Latency: ${ping} ms`,
                `◦ Download: ${downloadSpeed} Mbps`,
                `◦ Upload: ${uploadSpeed} Mbps`,
                ``,
                `📈 *Quality Assessment*`,
                `◦ Download: ${getQuality(downloadSpeed)}`,
                `◦ Upload: ${getQuality(uploadSpeed)}`,
                ``,
                `⏰ *Test Information*`,
                `◦ Time: ${new Date().toLocaleString('id-ID')}`,
                `◦ Method: Multi-stream test`,
                ``,
                `_Powered by Cloudflare Speed Test_`
            ].join('\n');

            await ctx.editMessage(msg.key, quote(output));

        } catch (error) {
            consolefy.error(`Error: ${error}`);
            return await ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
