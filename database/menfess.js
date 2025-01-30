const { connection } = require('./connection');

const menfessHelper = {
    async createMenfess(fromUser, toUser) {
        try {
            await connection.execute(
                'INSERT INTO menfess (from_user, to_user) VALUES (?, ?)',
                [fromUser, toUser]
            );
        } catch (error) {
            console.error('Error creating menfess:', error);
            throw error;
        }
    },

    async getMenfessByUser(userId) {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM menfess WHERE to_user = ? OR from_user = ?',
                [userId, userId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting menfess:', error);
            return [];
        }
    },

    async deleteMenfess(id) {
        try {
            await connection.execute(
                'DELETE FROM menfess WHERE id = ?',
                [id]
            );
        } catch (error) {
            console.error('Error deleting menfess:', error);
            throw error;
        }
    },

    async resetMenfessData() {
        try {
            // Menghapus semua data menfess dari tabel
            await connection.execute('DELETE FROM menfess');

            console.log(`[${config.pkg.name}] Berhasil mereset data menfess.`);
        } catch (error) {
            console.error(`[${config.pkg.name}] Error mereset data menfess:`, error);
        }
    },

    async cleanMenfessData() {
        try {
            await connection.execute('TRUNCATE TABLE menfess');
            return true;
        } catch (error) {
            console.error('Error cleaning menfess data:', error);
            throw error;
        }
    }
};

module.exports = menfessHelper; 