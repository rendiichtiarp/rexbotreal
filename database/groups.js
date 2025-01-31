const { connection, getConnection } = require('./connection');

const groupHelper = {
    async getGroup(groupId) {
        let conn;
        try {
            conn = await getConnection();
            const [rows] = await conn.execute(
                'SELECT * FROM `group_settings` WHERE group_id = ?',
                [groupId]
            );
            
            // Jika tidak ada data, kembalikan null
            if (!rows || rows.length === 0) {
                return null;
            }

            // Pastikan nilai boolean dikonversi ke number
            const result = rows[0];
            // Konversi eksplisit ke number untuk semua kolom boolean
            ['antilink', 'antinsfw', 'antisticker', 'antitoxic', 'autokick', 'welcome', 'shalat', 'intro'].forEach(key => {
                result[key] = result[key] === null ? 0 : Number(result[key]);
            });
            
            return result;
        } catch (error) {
            console.error('Error getting group:', error);
            return null;
        } finally {
            if (conn) conn.release();
        }
    },

    async createGroup(groupId) {
        let conn;
        try {
            conn = await getConnection();
            // Cek apakah grup sudah ada
            const [existing] = await conn.execute(
                'SELECT group_id FROM group_settings WHERE group_id = ?',
                [groupId]
            );

            if (existing && existing.length > 0) {
                console.log(`[Group] Group ${groupId} already exists`);
                return false;
            }

            // Buat data grup baru dengan nilai default
            await conn.execute(
                `INSERT INTO group_settings (
                    group_id, welcome, antilink, antinsfw, antisticker,
                    antitoxic, autokick, shalat, intro,
                    text_welcome, text_goodbye, text_intro
                ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL)`,
                [groupId]
            );

            console.log(`[Group] Successfully created group ${groupId}`);
            return true;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateGroup(groupId, groupData) {
        let conn;
        try {
            conn = await getConnection();
            const {
                text_intro,
                antilink,
                antinsfw,
                antitoxic,
                antisticker,
                autokick,
                welcome,
                shalat,
                text_welcome,
                text_goodbye
            } = groupData;

            await conn.execute(
                `UPDATE \`group_settings\` SET 
                    text_intro = ?, antilink = ?, antinsfw = ?, antitoxic = ?, 
                    antisticker = ?, autokick = ?, welcome = ?, shalat = ?, 
                    text_welcome = ?, text_goodbye = ? 
                WHERE group_id = ?`,
                [text_intro, antilink, antinsfw, antitoxic, 
                 antisticker, autokick, welcome, shalat, 
                 text_welcome, text_goodbye, groupId]
            );
        } catch (error) {
            console.error('Error updating group:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateTextIntro(groupId, textIntro) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                `UPDATE \`group_settings\` SET text_intro = ? WHERE group_id = ?`,
                [textIntro, groupId]
            );
        } catch (error) {
            console.error('Error updating text_intro:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateTextWelcome(groupId, textWelcome) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                `UPDATE \`group_settings\` SET text_welcome = ? WHERE group_id = ?`,
                [textWelcome, groupId]
            );
        } catch (error) {
            console.error('Error updating text_welcome:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateTextGoodbye(groupId, textGoodbye) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                `UPDATE \`group_settings\` SET text_goodbye = ? WHERE group_id = ?`,
                [textGoodbye, groupId]
            );
        } catch (error) {
            console.error('Error updating text_goodbye:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAntilink(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'UPDATE `group_settings` SET antilink = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antilink:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAntinsfw(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'UPDATE `group_settings` SET antinsfw = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antinsfw:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAntitoxic(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'UPDATE `group_settings` SET antitoxic = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antitoxic:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAntisticker(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'UPDATE `group_settings` SET antisticker = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antisticker:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAutokick(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'UPDATE `group_settings` SET autokick = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating autokick:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateWelcome(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                `UPDATE \`group_settings\` SET welcome = ? WHERE group_id = ?`,
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating welcome:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateShalat(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                `UPDATE \`group_settings\` SET shalat = ? WHERE group_id = ?`,
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating shalat:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async deleteGroup(groupId) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'DELETE FROM `group_settings` WHERE group_id = ?',
                [groupId]
            );
        } catch (error) {
            console.error('Error deleting group:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async fixGroupData() {
        let conn;
        try {
            conn = await getConnection();
            // Reset nilai boolean yang tidak valid
            await conn.execute(`
                UPDATE group_settings 
                SET welcome = COALESCE(welcome, false),
                    antilink = COALESCE(antilink, false),
                    antinsfw = COALESCE(antinsfw, false),
                    antisticker = COALESCE(antisticker, false),
                    antitoxic = COALESCE(antitoxic, false),
                    autokick = COALESCE(autokick, false),
                    shalat = COALESCE(shalat, false)
            `);

            // Hapus data grup yang tidak valid
            await conn.execute(`
                DELETE FROM group_settings 
                WHERE group_id REGEXP '[^0-9]' 
                OR group_id IS NULL
            `);

            return true;
        } catch (error) {
            console.error('Error fixing group data:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async cleanGroupData() {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute('TRUNCATE TABLE group_settings');
            return true;
        } catch (error) {
            console.error('Error cleaning group data:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateIntro(groupId, status) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'UPDATE group_settings SET intro = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating intro:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = groupHelper; 