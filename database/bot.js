const { connection } = require('./connection');

const botHelper = {
    async setSetting(key, value) {
        try {
            // Cek apakah setting sudah ada
            const [existing] = await connection.execute(
                'SELECT setting_key FROM bot_settings WHERE setting_key = ?',
                [key]
            );

            if (existing.length > 0) {
                // Update jika sudah ada
                await connection.execute(
                    'UPDATE bot_settings SET value = ? WHERE setting_key = ?',
                    [value, key]
                );
            } else {
                // Insert jika belum ada
                await connection.execute(
                    'INSERT INTO bot_settings (setting_key, value) VALUES (?, ?)',
                    [key, value]
                );
            }
        } catch (error) {
            console.error('Error setting bot setting:', error);
            throw error;
        }
    },

    async getSetting(key) {
        try {
            const [rows] = await connection.execute(
                'SELECT value FROM bot_settings WHERE setting_key = ?',
                [key]
            );
            return rows[0] ? rows[0].value : null;
        } catch (error) {
            console.error('Error getting bot setting:', error);
            return null;
        }
    },

    async deleteSetting(key) {
        try {
            await connection.execute(
                'DELETE FROM bot_settings WHERE setting_key = ?',
                [key]
            );
        } catch (error) {
            console.error('Error deleting bot setting:', error);
            throw error;
        }
    },

    async updateTextPrice(text) {
        try {
            await connection.execute(
                'UPDATE bot_settings SET value = ? WHERE setting_key = ?',
                [text, 'text_price']
            );
        } catch (error) {
            console.error('Error updating text price:', error);
            throw error;
        }
    },

    async cleanBotData() {
        try {
            await connection.execute('TRUNCATE TABLE bot_settings');
            return true;
        } catch (error) {
            console.error('Error cleaning bot data:', error);
            throw error;
        }
    }
};

module.exports = botHelper; 