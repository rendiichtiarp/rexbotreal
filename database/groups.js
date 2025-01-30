const { connection } = require('./connection');

const groupHelper = {
    async getGroup(groupId) {
        try {
            const [rows] = await connection.execute(
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
        }
    },

    async createGroup(groupId) {
        try {
            // Cek apakah grup sudah ada
            const [existing] = await connection.execute(
                'SELECT group_id FROM group_settings WHERE group_id = ?',
                [groupId]
            );

            if (existing && existing.length > 0) {
                console.log(`[Group] Group ${groupId} already exists`);
                return false;
            }

            // Buat data grup baru dengan nilai default
            const [result] = await connection.execute(
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
        }
    },

    async updateGroup(groupId, groupData) {
        try {
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

            await connection.execute(
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
        }
    },

    async updateTextIntro(groupId, textIntro) {
        try {
            await connection.execute(
                `UPDATE \`group_settings\` SET text_intro = ? WHERE group_id = ?`,
                [textIntro, groupId]
            );
        } catch (error) {
            console.error('Error updating text_intro:', error);
            throw error;
        }
    },

    async updateTextWelcome(groupId, textWelcome) {
        try {
            await connection.execute(
                `UPDATE \`group_settings\` SET text_welcome = ? WHERE group_id = ?`,
                [textWelcome, groupId]
            );
        } catch (error) {
            console.error('Error updating text_welcome:', error);
            throw error;
        }
    },

    async updateTextGoodbye(groupId, textGoodbye) {
        try {
            await connection.execute(
                `UPDATE \`group_settings\` SET text_goodbye = ? WHERE group_id = ?`,
                [textGoodbye, groupId]
            );
        } catch (error) {
            console.error('Error updating text_goodbye:', error);
            throw error;
        }
    },

    async updateAntilink(groupId, status) {
        try {
            await connection.execute(
                'UPDATE `group_settings` SET antilink = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antilink:', error);
            throw error;
        }
    },

    async updateAntinsfw(groupId, status) {
        try {
            await connection.execute(
                'UPDATE `group_settings` SET antinsfw = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antinsfw:', error);
            throw error;
        }
    },

    async updateAntitoxic(groupId, status) {
        try {
            await connection.execute(
                'UPDATE `group_settings` SET antitoxic = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antitoxic:', error);
            throw error;
        }
    },

    async updateAntisticker(groupId, status) {
        try {
            await connection.execute(
                'UPDATE `group_settings` SET antisticker = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating antisticker:', error);
            throw error;
        }
    },

    async updateAutokick(groupId, status) {
        try {
            await connection.execute(
                'UPDATE `group_settings` SET autokick = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating autokick:', error);
            throw error;
        }
    },

    async updateWelcome(groupId, status) {
        try {
            await connection.execute(
                `UPDATE \`group_settings\` SET welcome = ? WHERE group_id = ?`,
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating welcome:', error);
            throw error;
        }
    },

    async updateShalat(groupId, status) {
        try {
            await connection.execute(
                `UPDATE \`group_settings\` SET shalat = ? WHERE group_id = ?`,
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating shalat:', error);
            throw error;
        }
    },

    async deleteGroup(groupId) {
        try {
            await connection.execute(
                'DELETE FROM `group_settings` WHERE group_id = ?',
                [groupId]
            );
        } catch (error) {
            console.error('Error deleting group:', error);
            throw error;
        }
    },

    async fixGroupData() {
        try {
            // Reset nilai boolean yang tidak valid
            await connection.execute(`
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
            await connection.execute(`
                DELETE FROM group_settings 
                WHERE group_id REGEXP '[^0-9]' 
                OR group_id IS NULL
            `);

            return true;
        } catch (error) {
            console.error('Error fixing group data:', error);
            throw error;
        }
    },

    async cleanGroupData() {
        try {
            await connection.execute('TRUNCATE TABLE group_settings');
            return true;
        } catch (error) {
            console.error('Error cleaning group data:', error);
            throw error;
        }
    },

    async updateIntro(groupId, status) {
        try {
            await connection.execute(
                'UPDATE group_settings SET intro = ? WHERE group_id = ?',
                [status, groupId]
            );
        } catch (error) {
            console.error('Error updating intro:', error);
            throw error;
        }
    }
};

module.exports = groupHelper; 