const { quote } = require("@mengkodingan/ckptw");
const express = require("express");
const cors = require("cors");

function createServer(bot, c) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Middleware untuk verifikasi API key
    const verifyApiKey = (req, res, next) => {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (!apiKey) {
            return res.status(401).json({
                status: false,
                message: "API key is required"
            });
        }

        // Verifikasi API key dengan yang ada di config
        if (apiKey !== process.env.API_KEY) {
            return res.status(403).json({
                status: false,
                message: "Invalid API key"
            });
        }

        next();
    };

    // Test endpoint dengan GET (tanpa API key untuk testing)
    app.get("/api/test", (req, res) => {
        res.json({
            status: true,
            message: "API is working"
        });
    });

    // Endpoint untuk update status report
    app.post("/api/report/update", verifyApiKey, handleUpdateReport);
    app.get("/api/report/update", verifyApiKey, handleUpdateReport);

    async function handleUpdateReport(req, res) {
        try {
            // Ambil data dari body (POST) atau query (GET)
            const data = req.method === 'POST' ? req.body : req.query;
            const { report_code, status, response, admin_id } = data;

            // Validasi input
            if (!report_code || !status || !admin_id) {
                return res.status(400).json({
                    status: false,
                    message: "Missing required fields (report_code, status, admin_id)"
                });
            }

            // Validasi status
            const validStatus = ['pending', 'process', 'done', 'rejected'];
            if (!validStatus.includes(status)) {
                return res.status(400).json({
                    status: false,
                    message: `Invalid status. Use: ${validStatus.join(', ')}`
                });
            }

            // Ambil detail report
            const report = await Database.getReportByCode(report_code);
            if (!report) {
                return res.status(404).json({
                    status: false,
                    message: "Report not found"
                });
            }

            // Update report
            await Database.updateReport(report_code, {
                status,
                admin_response: response || report.admin_response
            }, admin_id);

            // Format pesan notifikasi
            const statusMsg = {
                'done': 'telah selesai ditangani',
                'process': 'sedang diproses',
                'rejected': 'ditolak',
                'pending': 'dalam antrian'
            };

            let notifMessage;
            
            if (status === 'done') {
                notifMessage = `${quote("LAPORAN SELESAI")}\n\n` +
                    `${quote(`Laporan Anda dengan nomor ${report_code} telah selesai ditangani`)}\n` +
                    (response ? `${quote(`Respon Admin:`)}${(response)}\n` : '') +
                    `${quote(`Ditangani oleh: ${admin_id}\n`)}` +
                    `\n${quote(config.msg.footer)}`;
            } else if (status === 'process') {
                notifMessage = `${quote("LAPORAN DIPROSES")}\n\n` +
                    `${quote(`Laporan Anda dengan nomor ${report_code} sedang dalam proses penanganan`)}\n` +
                    `${quote(`Ditangani oleh: ${admin_id}\n`)}` +
                    `\n${quote(config.msg.footer)}`;
            } else if (status === 'rejected') {
                notifMessage = `${quote("LAPORAN DITOLAK")}\n\n` +
                    `${quote(`Laporan Anda dengan nomor ${report_code} tidak dapat diproses/ditolak`)}\n` +
                    (response ? `${quote(`Respon Admin:`)}${(response)}\n` : '') +
                    `${quote(`Ditangani: ${admin_id}\n`)}` +
                    `\n${quote(config.msg.footer)}`;
            } else {
                notifMessage = `${quote("UPDATE LAPORAN")}\n\n` +
                    `${quote(`Laporan Anda dengan nomor ${report_code} ${statusMsg[status]}`)}\n` +
                    (response ? `${quote(`Respon Admin:`)}${(response)}\n` : '') +
                    `${quote(`Ditangani oleh: ${admin_id}\n`)}` +
                    `\n${quote(config.msg.footer)}`;
            }

            // Kirim notifikasi ke pengguna
            await bot.core.sendMessage(`${report.user_id}@s.whatsapp.net`, {
                text: notifMessage
            });

            res.json({
                status: true,
                message: "Report updated successfully",
                data: {
                    report_code,
                    new_status: status,
                    notification_sent: true
                }
            });

        } catch (error) {
            console.error("Error updating report:", error);
            res.status(500).json({
                status: false,
                message: "Failed to update report",
                error: error.message
            });
        }
    }

    // Endpoint untuk mengirim OTP (dengan API key)
    app.post("/api/send-otp", verifyApiKey, handleSendOTP);
    app.get("/api/send-otp", verifyApiKey, handleSendOTP);

    async function handleSendOTP(req, res) {
        try {
            const { user_id, otp, expires_at } = req.method === 'POST' ? req.body : req.query;
            
            if (!user_id || !otp || !expires_at) {
                return res.status(400).json({
                    status: false,
                    message: "Missing required fields"
                });
            }

            // Kirim OTP via WhatsApp
            await bot.core.sendMessage(`${user_id}@s.whatsapp.net`, {
                text: (
                    `*${otp}* adalah kode verifikasi Anda, Demi keamanan, jangan bagikan kode ini.`
                )
            });

            res.json({
                status: true,
                message: "OTP sent successfully"
            });
        } catch (error) {
            console.error("Error sending OTP:", error);
            res.status(500).json({
                status: false,
                message: "Failed to send OTP"
            });
        }
    }

    // Endpoint untuk verifikasi nomor WhatsApp (dengan API key)
    app.post("/api/verify-whatsapp", verifyApiKey, handleVerifyWhatsApp);
    app.get("/api/verify-whatsapp", verifyApiKey, handleVerifyWhatsApp);

    async function handleVerifyWhatsApp(req, res) {
        try {
            const phone_number = req.method === 'POST' ? req.body.phone_number : req.query.phone_number;
            
            if (!phone_number) {
                return res.status(400).json({
                    status: false,
                    message: "Phone number is required"
                });
            }

            // Cek apakah nomor terdaftar di WhatsApp
            const [result] = await bot.core.onWhatsApp(phone_number);
            
            res.json({
                status: true,
                exists: !!result?.exists,
                message: result?.exists ? 
                    "WhatsApp number is valid" : 
                    "WhatsApp number is not registered"
            });
        } catch (error) {
            console.error("Error verifying WhatsApp number:", error);
            res.status(500).json({
                status: false,
                message: "Failed to verify WhatsApp number"
            });
        }
    }

    return app;
}

module.exports = createServer; 