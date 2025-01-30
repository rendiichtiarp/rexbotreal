const { connection } = require('./connection');

const userHelper = {
    async getUser(noUser) {
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE no_user = ?',
                [noUser]
            );
            return rows[0] || {};
        } catch (error) {
            console.error('Error getting user:', error);
            return {};
        }
    },

    async createUser(userData) {
        try {
            const { 
                no_user,
                user_limit = 10,
                coin = 1000,
                level = 0,
                uid,
                xp = 0,
                name = null,
                birth_date = null,
                birth_date_time = null,
                age = null,
                premium = false,
                banned = false,
                afk = false,
                wingame = 0,
                registered = false,
            } = userData;

            await connection.execute(
                `INSERT INTO users (
                    uid, no_user, name, birth_date, birth_date_time, 
                    age, premium, banned, afk, coin, 
                    \`user_limit\`, level, xp, wingame, registered
                ) VALUES (
                    ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?
                )`,
                [
                    uid, no_user, name, birth_date, birth_date_time,
                    age, premium, banned, afk, coin,
                    user_limit, level, xp, wingame, registered
                ]
            );

        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async updateUserCoin(noUser, amount) {
        try {
            // Jika amount negatif, berarti mengurangi coin
            if (amount < 0) {
                await connection.execute(
                    'UPDATE users SET coin = coin + ? WHERE no_user = ? AND coin >= ?',
                    [amount, noUser, Math.abs(amount)]
                );
            } else {
                // Jika positif, tambahkan coin
                await connection.execute(
                    'UPDATE users SET coin = coin + ? WHERE no_user = ?',
                    [amount, noUser]
                );
            }
            return true;
        } catch (error) {
            console.error('Error updating user coin:', error);
            throw error;
        }
    },

    async updateUserLimit(noUser, amount) {
        try {
            // Jika amount negatif, berarti mengurangi limit
            if (amount < 0) {
                await connection.execute(
                    'UPDATE users SET user_limit = user_limit + ? WHERE no_user = ? AND user_limit >= ?',
                    [amount, noUser, Math.abs(amount)]
                );
            } else {
                // Jika positif, tambahkan limit
                await connection.execute(
                    'UPDATE users SET user_limit = user_limit + ? WHERE no_user = ?',
                    [amount, noUser]
                );
            }
            return true;
        } catch (error) {
            console.error('Error updating user limit:', error);
            throw error;
        }
    },

    async addXP(noUser, amount) {
        try {
            // Dapatkan data user terlebih dahulu
            const [currentUser] = await connection.execute(
                'SELECT xp, level FROM users WHERE no_user = ?',
                [noUser]
            );

            if (currentUser && currentUser[0]) {
                // Hitung XP baru
                const currentXP = parseInt(currentUser[0].xp || 0);
                const newXP = currentXP + amount;
                
                // Update XP menggunakan query yang lebih aman
                await connection.execute(
                    'UPDATE users SET xp = ? WHERE no_user = ?',
                    [newXP, noUser]
                );

                // Hitung level baru (setiap 100 XP = 1 level)
                const currentLevel = parseInt(currentUser[0].level || 0);
                const newLevel = Math.floor(newXP / 100);

                // Update level jika naik
                if (newLevel > currentLevel) {
                    await connection.execute(
                        'UPDATE users SET level = ? WHERE no_user = ?',
                        [newLevel, noUser]
                    );
                }

                // Verifikasi update berhasil
                const [verifyUpdate] = await connection.execute(
                    'SELECT xp, level FROM users WHERE no_user = ?',
                    [noUser]
                );
                
                return {
                    success: true,
                    oldXP: currentXP,
                    newXP: verifyUpdate[0].xp,
                    oldLevel: currentLevel,
                    newLevel: verifyUpdate[0].level
                };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error updating user XP:', error);
            throw error;
        }
    },

    async updateWinGame(noUser) {
        try {
            await connection.execute(
                'UPDATE users SET wingame = wingame + 1 WHERE no_user = ?',
                [noUser]
            );
        } catch (error) {
            console.error('Error updating win game:', error);
        }
    },

    async setAFK(noUser, status, reason = null) {
        try {
            await connection.execute(
                'UPDATE users SET afk = ?, afk_reason = ?, afk_time = ? WHERE no_user = ?',
                [status, reason, status ? Date.now() : 0, noUser]
            );
        } catch (error) {
            console.error('Error updating AFK status:', error);
            throw error;
        }
    },

    async setBanned(noUser, status) {
        try {
            await connection.execute(
                'UPDATE users SET banned = ? WHERE no_user = ?',
                [status, noUser]
            );
        } catch (error) {
            console.error('Error updating banned status:', error);
        }
    },

    async setPremium(noUser, status) {
        try {
            await connection.execute(
                'UPDATE users SET premium = ? WHERE no_user = ?',
                [status, noUser]
            );
        } catch (error) {
            console.error('Error updating premium status:', error);
        }
    },

    async updateUserProfile(noUser, userData) {
        try {
            const { name, birth_date, birth_date_time, age, registered } = userData;
            await connection.execute(
                `UPDATE users 
                 SET name = ?, birth_date = ?, birth_date_time = ?, age = ?, registered = ? 
                 WHERE no_user = ?`,
                [name, birth_date, birth_date_time, age, registered, noUser]
            );
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    },

    async setAutoLevelup(noUser, status) {
        try {
            await connection.execute(
                'UPDATE users SET autolevelup = ? WHERE no_user = ?',
                [status, noUser]
            );
        } catch (error) {
            console.error('Error updating autolevelup status:', error);
            throw error;
        }
    },

    async deleteUser(noUser) {
        try {
            await connection.execute(
                'DELETE FROM users WHERE no_user = ?',
                [noUser]
            );
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    async getLeaderboard() {
        try {
            const [rows] = await connection.execute(
                `SELECT 
                    no_user as id,
                    name,
                    level,
                    xp,
                    wingame,
                    premium
                FROM users 
                ORDER BY wingame DESC, level DESC, xp DESC
                LIMIT 100`
            );
            return rows;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    },

    async getUserRank(noUser) {
        try {
            const query = `
                SELECT COUNT(*) + 1 as user_rank
                    FROM users
                    WHERE (wingame > (SELECT wingame FROM users WHERE no_user = ?))
                    OR (wingame = (SELECT wingame FROM users WHERE no_user = ?)
                        AND level > (SELECT level FROM users WHERE no_user = ?))
            `;
            const [result] = await connection.execute(
                query,
                [noUser, noUser, noUser]
            );
            return result[0]?.user_rank || '-';
        } catch (error) {
            console.error('Error getting user rank:', error);
            return '-';
        }
    },

    async transferCoin(fromUser, toUser, amount) {
        try {
            // Subtract from sender
            const [result] = await connection.execute(
                'UPDATE users SET coin = coin - ? WHERE no_user = ? AND coin >= ?',
                [amount, fromUser, amount]
            );

            // Check if the sender had enough coins
            if (result.affectedRows === 0) {
                throw new Error('Pengguna tidak memiliki cukup koin untuk transfer.');
            }

            // Add to receiver
            await connection.execute(
                'UPDATE users SET coin = coin + ? WHERE no_user = ?',
                [amount, toUser]
            );

            return true;
        } catch (error) {
            console.error('Error transferring coin:', error);
            throw error;
        }
    },

    async claimReward(noUser, claimType, amount) {
        try {
            const columnName = `last_claim_${claimType}`;
            await connection.execute(
                `UPDATE users 
                 SET coin = coin + ?,
                     ${columnName} = ?
                 WHERE no_user = ?`,
                [amount, Date.now(), noUser]
            );
            return true;
        } catch (error) {
            console.error('Error claiming reward:', error);
            throw error;
        }
    },

    async getLastClaim(noUser, claimType) {
        try {
            const [rows] = await connection.execute(
                `SELECT last_claim_${claimType} as lastClaim 
                 FROM users 
                 WHERE no_user = ?`,
                [noUser]
            );
            return rows[0]?.lastClaim || 0;
        } catch (error) {
            console.error('Error getting last claim:', error);
            return 0;
        }
    },

    async getAFKInfo(noUser) {
        try {
            const [rows] = await connection.execute(
                'SELECT afk, afk_reason, afk_time FROM users WHERE no_user = ?',
                [noUser]
            );
            return rows[0] || {};
        } catch (error) {
            console.error('Error getting AFK info:', error);
            return {};
        }
    },

    async addCoin(noUser, amount) {
        try {
            await connection.execute(
                'UPDATE users SET coin = coin + ? WHERE no_user = ?',
                [amount, noUser]
            );
            return true;
        } catch (error) {
            console.error('Error adding coin:', error);
            throw error;
        }
    },

    async getBannedUsers() {
        try {
            const [rows] = await connection.execute(
                'SELECT no_user FROM users WHERE banned = ?',
                [true]
            );
            return rows.map(row => row.no_user);
        } catch (error) {
            console.error('Error getting banned users:', error);
            return [];
        }
    },

    async getPremiumUsers() {
        try {
            const [rows] = await connection.execute(
                'SELECT no_user FROM users WHERE premium = ?',
                [true]
            );
            return rows.map(row => row.no_user);
        } catch (error) {
            console.error('Error getting premium users:', error);
            return [];
        }
    },

    async addWinGame(noUser) {
        try {
            await connection.execute(
                'UPDATE users SET wingame = wingame + 1 WHERE no_user = ?',
                [noUser]
            );
            return true;
        } catch (error) {
            console.error('Error updating win game:', error);
            throw error;
        }
    },

    async fixUserData() {
        try {
            // Reset nilai-nilai yang tidak valid
            await connection.execute(`
                UPDATE users 
                SET coin = CASE 
                        WHEN coin < 0 THEN 1000 
                        WHEN coin IS NULL THEN 1000 
                        ELSE coin 
                    END,
                    user_limit = CASE 
                        WHEN user_limit < 0 THEN 10 
                        WHEN user_limit IS NULL THEN 10 
                        ELSE user_limit 
                    END,
                    level = CASE 
                        WHEN level < 0 THEN 0 
                        WHEN level IS NULL THEN 0 
                        ELSE level 
                    END,
                    xp = CASE 
                        WHEN xp < 0 THEN 0 
                        WHEN xp IS NULL THEN 0 
                        ELSE xp 
                    END,
                    wingame = CASE 
                        WHEN wingame < 0 THEN 0 
                        WHEN wingame IS NULL THEN 0 
                        ELSE wingame 
                    END,
                    premium = CASE
                        WHEN premium_expired < NOW() THEN 0
                        ELSE premium
                    END,
                    banned = CASE
                        WHEN banned IS NULL THEN 0
                        ELSE banned
                    END,
                    afk = CASE
                        WHEN TIMESTAMPDIFF(HOUR, afk_time, NOW()) > 24 THEN 0
                        ELSE afk
                    END
            `);

            // Hapus data user yang tidak valid
            await connection.execute(`
                DELETE FROM users 
                WHERE no_user REGEXP '[^0-9]' 
                OR no_user IS NULL
            `);

            return true;
        } catch (error) {
            console.error('Error fixing user data:', error);
            throw error;
        }
    },

    async cleanUserData() {
        try {
            await connection.execute('TRUNCATE TABLE users');
            return true;
        } catch (error) {
            console.error('Error cleaning user data:', error);
            throw error;
        }
    },
};

module.exports = userHelper; 