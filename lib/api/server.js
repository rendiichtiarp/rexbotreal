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