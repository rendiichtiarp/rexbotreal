const { connection, getConnection } = require('./connection');

const menfessHelper = {
    async createMenfess(fromUser, toUser) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'INSERT INTO menfess (from_user, to_user) VALUES (?, ?)',
                [fromUser, toUser]
            );
        } catch (error) {
            console.error('Error creating menfess:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async getMenfessByUser(userId) {
        let conn;
        try {
            conn = await getConnection();
            const [rows] = await conn.execute(
                'SELECT * FROM menfess WHERE to_user = ? OR from_user = ?',
                [userId, userId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting menfess:', error);
            return [];
        } finally {
            if (conn) conn.release();
        }
    },

    async deleteMenfess(id) {
        let conn;
        try {
            conn = await getConnection();
            await conn.execute(
                'DELETE FROM menfess WHERE id = ?',
                [id]
            );
        } catch (error) {
            console.error('Error deleting menfess:', error);
            throw error;
        } finally {
            if (conn) conn.release();
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
        let conn;
        try {
            conn = await getConnection();
            await conn.execute('TRUNCATE TABLE menfess');
            return true;
        } catch (error) {
            console.error('Error cleaning menfess data:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = menfessHelper; 