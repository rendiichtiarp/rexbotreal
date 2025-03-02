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
        const [rows] = await pool.query('SELECT * FROM menfess');
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

    static async updateMenfess(id, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        const query = `
            UPDATE menfess 
            SET ${fields.map(field => `${field} = ?`).join(', ')}
            WHERE id = ?
        `;
        
        await pool.query(query, [...values, id]);
    }

    static async deleteMenfess(id) {
        await pool.query('DELETE FROM menfess WHERE id = ?', [id]);
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
        const currentCoin = user[0]?.coin;
        const currentWin = user[0]?.win_game;

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

    static async claimRedeemCode(codeId, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Cek apakah sudah pernah klaim
            const [claimed] = await conn.query(
                'SELECT id FROM redeem_history WHERE code_id = ? AND user_id = ?',
                [codeId, userId]
            );
            if (claimed.length > 0) throw new Error('Anda sudah mengklaim kode ini!');

            // Update jumlah klaim
            const [result] = await conn.query(
                'UPDATE redeem_codes SET current_claims = current_claims + 1 WHERE id = ? AND current_claims < max_claims',
                [codeId]
            );
            if (result.affectedRows === 0) throw new Error('Kode sudah mencapai batas maksimal klaim!');

            // Catat history
            await conn.query(
                'INSERT INTO redeem_history (code_id, user_id) VALUES (?, ?)',
                [codeId, userId]
            );

            await conn.commit();
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
            
            const itemId = `${item.tier}_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
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
}

module.exports = Database; 