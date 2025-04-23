const { quote, bold, monospace } = require("@mengkodingan/ckptw");
const express = require("express");
const cors = require("cors");
const crypto = require('crypto');
const {
    default:
    baileys,
    getContentType, proto
} = require("@whiskeysockets/baileys");


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

    // Endpoint untuk webhook Saweria
    app.post("/api/webhook/saweria", async (req, res) => {
        try {
            // Ekstrak data dari body
            const {
                id,
                amount_raw,
                cut,
                donator_name,
                donator_email,
                message,
                created_at,
                type
            } = req.body;

            // Hanya proses jika tipe adalah donasi
            if (type !== "donation") {
                return res.json({
                    status: true,
                    message: "Bukan event donasi, diabaikan"
                });
            }

            // Hitung jumlah bersih (setelah potongan)
            const amount_net = amount_raw - cut;

            // Format pesan notifikasi dengan formatting yang lebih baik
            // Array pesan acak untuk variasi
            const openingMessages = [
                `Hey! ${donator_name} baru saja mengirim donasi keren`,
                `Asik! Ada donasi masuk dari ${donator_name}`,
                `Wah keren! ${donator_name} memberikan dukungannya`, 
                `Yuhuu! ${donator_name} baru aja kirim donasi nih`,
                `Mantap! ${donator_name} ikutan support kita`
            ];

            const closingMessages = [
                `${("Thanks banget ya atas dukungannya!")}\n${("Semoga harimu menyenangkan!")}`,
                `${("Makasih banyak! Kamu the best!")}\n${("Thanks udah support kita!")}`,
                `${("Makasih ya udah berdonasi!")}\n${("Semoga sukses selalu!")}`,
                `${("Super sekali dukungannya!")}\n${("Semoga semuanya lancar!")}`,
                `${("Thanks udah jadi bagian dari kami!")}\n${("Semoga sehat dan bahagia!")}`
            ];

            // Sensor email dengan hanya menampilkan 3 karakter pertama dan terakhir
            const emailParts = donator_email.split('@');
            const username = emailParts[0];
            const domain = emailParts[1];
            
            const sensoredUsername = username.length > 3 
                ? username.slice(0, 3) + '*'.repeat(username.length - 3)
                : username;
            const sensoredEmail = `${sensoredUsername}@${domain}`;

            const notifMessage = 
                `${openingMessages[Math.floor(Math.random() * openingMessages.length)]} sebesar ${monospace(`Rp ${Number(amount_raw).toLocaleString('id-ID')}`)}\n\n` +
                (message ? `${quote(`Pesan:\n${message}`)}\n\n` : '') +
                closingMessages[Math.floor(Math.random() * closingMessages.length)];

            // Kirim notifikasi ke channel newsletter
            await bot.core.sendMessage(config.bot.groups.donation, {
                text: notifMessage,
                contextInfo: {
                    externalAdReply: {
                        title: `${donator_name} Memberikan Donasi`,
                        body: `${sensoredEmail}`,
                    }
                },
            });

            res.json({
                status: true,
                message: "Webhook processed successfully"
            });

        } catch (error) {
            console.error("Error processing Saweria webhook:", error);
            res.status(500).json({
                status: false,
                message: "Failed to process webhook",
                error: error.message
            });
        }
    });

    return app;
}

module.exports = createServer; 