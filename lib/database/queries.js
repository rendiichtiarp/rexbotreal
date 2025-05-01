const {
    quote,
} = require("@mengkodingan/ckptw");
const { pool } = require('./connection');

class Database {
    static async getUser(userId) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        return rows[0] || null;
    }

    static async updateUser(id, data) {
        try {
            const columns = [];
            const values = [];
            
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'id') {
                    columns.push(`${key} = ?`);
                    values.push(value);
                }
            });

            // Gunakan INSERT ... ON DUPLICATE KEY UPDATE
            const fields = Object.keys(data);
            const query = `
                INSERT INTO users (id, ${fields.join(', ')})
                VALUES (?, ${fields.map(() => '?').join(', ')})
                ON DUPLICATE KEY UPDATE
                ${columns.join(', ')}
            `;

            await pool.query(query, [id, ...values, ...values]);
            
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }

    static async getGroup(groupId) {
        const [rows] = await pool.query('SELECT * FROM group_settings WHERE id = ?', [groupId]);
        return rows[0] || null;
    }

    static async updateGroup(groupId, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        const query = `
            INSERT INTO group_settings (id, ${fields.join(', ')})
            VALUES (?, ${fields.map(() => '?').join(', ')})
            ON DUPLICATE KEY UPDATE
            ${fields.map(field => `${field} = VALUES(${field})`).join(', ')}
        `;
        
        await pool.query(query, [groupId, ...values]);
    }

    static async getBotMode() {
        const [rows] = await pool.query('SELECT mode FROM bot_mode LIMIT 1');
        return rows[0]?.mode || 'public';
    }

    static async updateBotMode(mode) {
        try {
            // Langsung update/insert mode tanpa perlu cek ID
            await pool.query('DELETE FROM bot_mode');  // Hapus data lama
            await pool.query('INSERT INTO bot_mode (mode) VALUES (?)', [mode]); // Insert data baru
            return true;
        } catch (error) {
            console.error("Failed to update bot mode:", error);
            return false;
        }
    }

    static async getLastRestart() {
        const [rows] = await pool.query('SELECT * FROM bot_restart ORDER BY id DESC LIMIT 1');
        return rows[0];
    }

    static async updateRestart(data) {
        await pool.query(
            'INSERT INTO bot_restart (jid, message_key, timestamp) VALUES (?, ?, ?)',
            [data.jid, JSON.stringify(data.key), data.timestamp]
        );
    }

    static async getBotSettings() {
        const [rows] = await pool.query('SELECT * FROM bot_settings LIMIT 1');
        return rows[0] || null;
    }

    static async updateBotSettings(data) {
        try {
            // Ambil data settings yang sudah ada
            const [currentSettings] = await pool.query('SELECT * FROM bot_settings LIMIT 1');
            
            // Gabungkan data lama dengan data baru
            const updatedData = {
                ...currentSettings[0], // Pertahankan data lama
                ...data // Tambahkan/update dengan data baru
            };

            // Hapus data lama
            await pool.query('DELETE FROM bot_settings');
            
            // Insert data yang sudah digabung
            const fields = Object.keys(updatedData);
            await pool.query(
                `INSERT INTO bot_settings (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
                Object.values(updatedData)
            );
            return true;
        } catch (error) {
            console.error("Failed to update bot settings:", error);
            return false;
        }
    }

    static async getAllUsers() {
        const [rows] = await pool.query('SELECT * FROM users');
        return rows;
    }

    static async getAllGroups() {
        const [rows] = await pool.query('SELECT * FROM group_settings');
        return rows;
    }

    static async deleteUser(userId) {
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }

    static async deleteGroup(groupId) {
        await pool.query('DELETE FROM group_settings WHERE id = ?', [groupId]);
    }

    static async getStats() {
        const [rows] = await pool.query('SELECT * FROM stats WHERE id = 1');
        return rows[0] || null;
    }

    static async updateStats(data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        const query = `
            UPDATE stats 
            SET ${fields.map(field => `${field} = ?`).join(', ')}
            WHERE id = 1
        `;
        
        await pool.query(query, values);
    }

    static async incrementStat(field) {
        await pool.query(`UPDATE stats SET ${field} = ${field} + 1 WHERE id = 1`);
    }

    static async getMenfess() {
        const [rows] = await pool.query('SELECT * FROM menfess ORDER BY menfess_id DESC');
        return rows;
    }

    // Tambahkan method untuk mendapatkan menfess aktif
    static async getActiveMenfess() {
        const [rows] = await pool.query('SELECT * FROM menfess WHERE status = "active"');
        return rows;
    }

    static async createMenfess(data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        const query = `
            INSERT INTO menfess (${fields.join(', ')})
            VALUES (${fields.map(() => '?').join(', ')})
        `;
        
        await pool.query(query, values);
    }

    static async updateMenfess(menfessId, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        const query = `
            UPDATE menfess 
            SET ${fields.map(field => `${field} = ?`).join(', ')}
            WHERE menfess_id = ?
        `;
        
        await pool.query(query, [...values, menfessId]);
    }

    static async deleteMenfess(menfessId) {
        await pool.query('DELETE FROM menfess WHERE menfess_id = ?', [menfessId]);
    }

    // Method untuk menangani spam
    static async getSpamCount(key) {
        const [rows] = await pool.query('SELECT spam FROM group_settings WHERE id = ?', [key.split('.')[1]]);
        if (!rows[0] || !rows[0].spam) return { count: 0, lastMessageTime: 0 };
        
        const spamData = JSON.parse(rows[0].spam);
        return spamData[key.split('.')[3]] || { count: 0, lastMessageTime: 0 };
    }

    static async updateSpamCount(key, data) {
        const groupId = key.split('.')[1];
        const userId = key.split('.')[3];
        
        const [rows] = await pool.query('SELECT spam FROM group_settings WHERE id = ?', [groupId]);
        let spamData = rows[0]?.spam ? JSON.parse(rows[0].spam) : {};
        
        spamData[userId] = data;
        
        await this.updateGroup(groupId, {
            spam: JSON.stringify(spamData)
        });
    }

    static async deleteSpamCount(key) {
        const groupId = key.split('.')[1];
        const userId = key.split('.')[3];
        
        const [rows] = await pool.query('SELECT spam FROM group_settings WHERE id = ?', [groupId]);
        if (!rows[0] || !rows[0].spam) return;
        
        let spamData = JSON.parse(rows[0].spam);
        delete spamData[userId];
        
        await this.updateGroup(groupId, {
            spam: JSON.stringify(spamData)
        });
    }

    // Method untuk menangani AFK
    static async updateAfk(userId, {reason, timestamp}) {
        await this.updateUser(userId, {
            afk_reason: reason,
            afk_timestamp: timestamp
        });
    }

    static async removeAfk(userId) {
        await this.updateUser(userId, {
            afk_reason: null,
            afk_timestamp: null
        });
    }

    // Method untuk menangani group options
    static async updateGroupOption(groupId, option, value) {
        const [rows] = await pool.query('SELECT option FROM group_settings WHERE id = ?', [groupId]);
        let options = rows[0]?.option ? JSON.parse(rows[0].option) : {};
        
        options[option] = value;
        
        await this.updateGroup(groupId, {
            option: JSON.stringify(options)
        });
    }

    static async updateGroupText(groupId, type, text) {
        const [rows] = await pool.query('SELECT text FROM group_settings WHERE id = ?', [groupId]);
        let texts = rows[0]?.text ? JSON.parse(rows[0].text) : {};
        
        texts[type] = text;
        
        await this.updateGroup(groupId, {
            text: JSON.stringify(texts)
        });
    }

    // Tambahkan method untuk game
    static async addGameReward(userId, coin, addWin = true) {
        const [user] = await pool.query('SELECT coin, win_game FROM users WHERE id = ?', [userId]);
        const currentCoin = user[0]?.coin || 0;
        const currentWin = user[0]?.win_game || 0;

        await this.updateUser(userId, {
            coin: currentCoin + coin,
            win_game: addWin ? (currentWin + 1) : currentWin
        });
    }

    static async deleteRestart() {
        try {
            // Gunakan query terpisah untuk mendapatkan ID terakhir
            const [lastRestart] = await pool.query('SELECT id FROM bot_restart ORDER BY id DESC LIMIT 1');
            if (lastRestart[0]?.id) {
                await pool.query('DELETE FROM bot_restart WHERE id = ?', [lastRestart[0].id]);
            }
            return true;
        } catch (error) {
            console.error("Failed to delete restart data:", error);
            return false;
        }
    }

    // Method untuk kode redeem
    static async createRedeemCode(data) {
        const { code, reward_type, reward_amount, max_claims, expired_at, created_by } = data;
        
        await pool.query(
            'INSERT INTO redeem_codes (code, reward_type, reward_amount, max_claims, expired_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [code, reward_type, reward_amount, max_claims, expired_at, created_by]
        );
    }

    static async getRedeemCode(code) {
        const [rows] = await pool.query('SELECT * FROM redeem_codes WHERE code = ?', [code]);
        return rows[0];
    }

    static async getRedeemClaimCount(codeId) {
        const [rows] = await pool.query('SELECT current_claims FROM redeem_codes WHERE id = ?', [codeId]);
        return rows[0]?.current_claims || 0;
    }

    static async claimRedeemCode(codeId, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Ambil data kode redeem
            const [codeData] = await conn.query(
                'SELECT * FROM redeem_codes WHERE id = ?',
                [codeId]
            );
            if (!codeData.length) throw new Error('INVALID_CODE');

            // Cek apakah sudah pernah klaim
            const [claimed] = await conn.query(
                'SELECT id FROM redeem_history WHERE code_id = ? AND user_id = ?',
                [codeId, userId]
            );
            if (claimed.length > 0) throw new Error('ALREADY_CLAIMED');

            // Cek dan update jumlah klaim
            if (codeData[0].current_claims >= codeData[0].max_claims) {
                throw new Error('MAX_CLAIMS_REACHED');
            }

            // Update jumlah klaim
            await conn.query(
                'UPDATE redeem_codes SET current_claims = current_claims + 1 WHERE id = ?',
                [codeId]
            );

            // Catat history
            await conn.query(
                'INSERT INTO redeem_history (code_id, user_id) VALUES (?, ?)',
                [codeId, userId]
            );

            await conn.commit();
            return codeData[0];
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // Method untuk menghapus kode redeem
    static async deleteRedeemCode(code) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Cek apakah kode ada
            const [codeData] = await conn.query('SELECT id FROM redeem_codes WHERE code = ?', [code]);
            if (!codeData.length) throw new Error('Kode tidak ditemukan!');
            
            // Hapus kode redeem (history tetap ada untuk pencatatan)
            await conn.query('DELETE FROM redeem_codes WHERE id = ?', [codeData[0].id]);

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // Method untuk inventori
    static async addItemToInventory(userId, item) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const itemId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            
            // Cek apakah item sudah ada di inventori
            const [existing] = await conn.query(
                'SELECT * FROM inventories WHERE user_id = ? AND item_id = ?',
                [userId, itemId]
            );

            if (existing.length > 0) {
                // Update quantity jika item sudah ada
                await conn.query(
                    'UPDATE inventories SET quantity = quantity + 1 WHERE user_id = ? AND item_id = ?',
                    [userId, itemId]
                );
            } else {
                // Tambahkan item baru ke inventori
                await conn.query(
                    'INSERT INTO inventories (user_id, item_id, item_name, item_tier, sell_price) VALUES (?, ?, ?, ?, ?)',
                    [userId, itemId, item.name, item.tier, item.coin]
                );
            }

            // Verifikasi item tersimpan
            const [verify] = await conn.query(
                'SELECT * FROM inventories WHERE user_id = ? AND item_id = ?',
                [userId, itemId]
            );

            if (!verify.length) {
                throw new Error('Gagal menyimpan item ke inventori');
            }

            await conn.commit();
            return verify[0];
        } catch (error) {
            await conn.rollback();
            console.error("Error adding item to inventory:", error);
            throw error;
        } finally {
            conn.release();
        }
    }

    static async getInventory(userId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM inventories WHERE user_id = ? ORDER BY item_tier DESC, item_name ASC',
                [userId]
            );
            return rows;
        } catch (error) {
            console.error("Error getting inventory:", error);
            throw error;
        }
    }

    static async sellItem(userId, itemId, quantity = 1) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Cek item di inventori
            const [item] = await conn.query(
                'SELECT * FROM inventories WHERE user_id = ? AND item_id = ?',
                [userId, itemId]
            );

            if (!item.length) throw new Error('Item tidak ditemukan di inventori!');
            if (item[0].quantity < quantity) throw new Error('Jumlah item tidak cukup!');

            const totalPrice = item[0].sell_price * quantity;

            // Update coin user
            await conn.query(
                'UPDATE users SET coin = coin + ? WHERE id = ?',
                [totalPrice, userId]
            );

            // Update atau hapus item dari inventori
            if (item[0].quantity === quantity) {
                await conn.query(
                    'DELETE FROM inventories WHERE user_id = ? AND item_id = ?',
                    [userId, itemId]
                );
            } else {
                await conn.query(
                    'UPDATE inventories SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?',
                    [quantity, userId, itemId]
                );
            }

            await conn.commit();
            return {
                soldQuantity: quantity,
                totalPrice: totalPrice,
                itemName: item[0].item_name
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // Method untuk mengecek dan mengirim OTP
    static async checkAndSendOTP(bot, lastCheckedId = 0) {
        const conn = await pool.getConnection();
        try {
            // Ambil semua reset password yang belum diproses dan belum expired
            const [resets] = await conn.query(
                'SELECT * FROM password_resets WHERE id > ? AND expires_at > ? ORDER BY id ASC',
                [lastCheckedId, Date.now()]
            );

            let newLastCheckedId = lastCheckedId;

            for (const reset of resets) {
                try {
                    // Update last checked id
                    newLastCheckedId = Math.max(newLastCheckedId, reset.id);

                    // Kirim OTP ke user
                    await bot.core.sendMessage(`${reset.user_id}@s.whatsapp.net`, {
                        text: quote(
                            `📬 Kode OTP untuk reset password Anda: ${reset.otp}\n` +
                            `${quote("⚠️ Kode ini hanya berlaku selama 5 menit.")}\n` +
                            `${quote("🔒 Jangan bagikan kode ini kepada siapapun!")}`
                        )
                    });
                } catch (error) {
                    consolefy.error(`Failed to send OTP to ${reset.user_id}:`, error);
                    // Lanjutkan ke OTP berikutnya jika ada error
                    continue;
                }
            }

            return newLastCheckedId;
        } catch (error) {
            consolefy.error("Error checking password resets:", error);
            throw error;
        } finally {
            conn.release();
        }
    }

    // Method untuk menangani reports
    static async createReport(userId, message) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Dapatkan ID terakhir untuk generate kode baru
            const [lastReport] = await conn.query('SELECT report_id FROM reports ORDER BY report_id DESC LIMIT 1');
            const nextId = (lastReport[0]?.report_id || 0) + 1;
            
            // Generate report code (format: #123)
            const reportCode = `#${nextId}`;

            // Insert report
            const [result] = await conn.query(
                'INSERT INTO reports (report_code, user_id, message) VALUES (?, ?, ?)',
                [reportCode, userId, message]
            );

            await conn.commit();
            return {
                reportId: result.insertId,
                reportCode: reportCode
            };
        } catch (error) {
            await conn.rollback();
            console.error("Error creating report:", error);
            throw error;
        } finally {
            conn.release();
        }
    }

    static async getReports(filters = {}) {
        try {
            let query = `
                SELECT r.*, 
                       u1.name as reporter_name,
                       u2.name as admin_name
                FROM reports r 
                LEFT JOIN users u1 ON r.user_id = u1.id
                LEFT JOIN users u2 ON r.admin_id = u2.id
                WHERE 1=1
            `;
            const params = [];

            // Apply filters
            if (filters.status) {
                query += ' AND r.status = ?';
                params.push(filters.status);
            }
            if (filters.userId) {
                query += ' AND r.user_id = ?';
                params.push(filters.userId);
            }
            if (filters.reportCode) {
                query += ' AND r.report_code = ?';
                params.push(filters.reportCode);
            }

            // Add date range filter if provided
            if (filters.startDate && filters.endDate) {
                query += ' AND r.created_at BETWEEN ? AND ?';
                params.push(filters.startDate, filters.endDate);
            }

            query += ' ORDER BY r.created_at DESC';

            // Add limit if provided
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }
            
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error("Error getting reports:", error);
            throw error;
        }
    }

    static async getReportByCode(reportCode) {
        try {
            const [rows] = await pool.query(
                `SELECT r.*, 
                        u1.name as reporter_name,
                        u2.name as admin_name
                 FROM reports r 
                 LEFT JOIN users u1 ON r.user_id = u1.id
                 LEFT JOIN users u2 ON r.admin_id = u2.id
                 WHERE r.report_code = ?`,
                [reportCode]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Error getting report:", error);
            throw error;
        }
    }

    static async updateReport(reportCode, data, adminId = null) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const updateData = { ...data };
            if (adminId) {
                updateData.admin_id = adminId;
            }
            if (data.status === 'done') {
                updateData.resolved_at = new Date();
            }

            const columns = [];
            const values = [];
            
            Object.entries(updateData).forEach(([key, value]) => {
                columns.push(`${key} = ?`);
                values.push(value);
            });

            await conn.query(
                `UPDATE reports SET ${columns.join(', ')} WHERE report_code = ?`,
                [...values, reportCode]
            );

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            console.error("Error updating report:", error);
            throw error;
        } finally {
            conn.release();
        }
    }

    static async deleteReport(reportCode) {
        try {
            await pool.query('DELETE FROM reports WHERE report_code = ?', [reportCode]);
            return true;
        } catch (error) {
            console.error("Error deleting report:", error);
            throw error;
        }
    }

    static async getReportStats() {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    COUNT(*) as total_reports,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
                    SUM(CASE WHEN status = 'process' THEN 1 ELSE 0 END) as processing_reports,
                    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as resolved_reports,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports,
                    AVG(CASE 
                        WHEN status = 'done' 
                        THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at)
                        ELSE NULL 
                    END) as avg_resolution_time
                FROM reports
            `);
            return rows[0];
        } catch (error) {
            console.error("Error getting report stats:", error);
            throw error;
        }
    }

    // Method untuk rating bot
    static async getRating(userId) {
        try {
            const [rows] = await pool.query('SELECT * FROM bot_ratings WHERE user_id = ?', [userId]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error getting rating:", error);
            throw error;
        }
    }

    static async setRating(userId, rating, message = null) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [existingRating] = await conn.query('SELECT * FROM bot_ratings WHERE user_id = ?', [userId]);

            if (existingRating.length > 0) {
                // Update rating yang sudah ada
                await conn.query(
                    'UPDATE bot_ratings SET rating = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [rating, message, userId]
                );
            } else {
                // Buat rating baru
                await conn.query(
                    'INSERT INTO bot_ratings (user_id, rating, message) VALUES (?, ?, ?)',
                    [userId, rating, message]
                );
            }

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            console.error("Error setting rating:", error);
            throw error;
        } finally {
            conn.release();
        }
    }

    static async getRatingStats() {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    COUNT(*) as total_ratings,
                    AVG(rating) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
                FROM bot_ratings
            `);
            return rows[0];
        } catch (error) {
            console.error("Error getting rating stats:", error);
            throw error;
        }
    }
}

module.exports = Database; 