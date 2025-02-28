-- Tabel users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    uid VARCHAR(255) DEFAULT NULL,
    name VARCHAR(255) DEFAULT NULL,
    birth_date DATE DEFAULT NULL,
    birth_date_time BIGINT DEFAULT NULL,
    age INT DEFAULT NULL,
    registered BOOLEAN DEFAULT false,
    coin INT DEFAULT 0,
    user_limit INT DEFAULT 0,
    xp INT DEFAULT 0,
    level INT DEFAULT 0,
    premium BOOLEAN DEFAULT false,
    banned BOOLEAN DEFAULT false,
    autolevelup BOOLEAN DEFAULT true,
    afk_reason TEXT NULL,
    afk_timestamp BIGINT NULL,
    win_game INT DEFAULT 0,
    has_sent_banned BOOLEAN DEFAULT false,
    has_sent_cooldown BOOLEAN DEFAULT false,
    has_sent_requireBotGroupMembership BOOLEAN DEFAULT false,
    last_claim_daily BIGINT DEFAULT 0,
    last_claim_weekly BIGINT DEFAULT 0,
    last_claim_monthly BIGINT DEFAULT 0,
    last_claim_yearly BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel group_settings
CREATE TABLE IF NOT EXISTS group_settings (
    id VARCHAR(255) PRIMARY KEY,
    mute BOOLEAN DEFAULT false,
    antilink BOOLEAN DEFAULT false,
    antinsfw BOOLEAN DEFAULT false,
    antispam BOOLEAN DEFAULT false,
    antisticker BOOLEAN DEFAULT false,
    antitoxic BOOLEAN DEFAULT false,
    autokick BOOLEAN DEFAULT false,
    welcome BOOLEAN DEFAULT false,
    intro_text LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    welcome_text LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    goodbye_text LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    spam LONGTEXT NULL,     
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabel bot_mode
CREATE TABLE IF NOT EXISTS bot_mode (
    mode ENUM('public', 'group', 'private', 'self') DEFAULT 'public',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel bot_restart
CREATE TABLE IF NOT EXISTS bot_restart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jid VARCHAR(255) NULL,
    message_key LONGTEXT NULL,
    timestamp BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel bot_settings
CREATE TABLE IF NOT EXISTS bot_settings (
    price TEXT NULL,
    donate TEXT NULL
);

-- Insert default bot mode
INSERT INTO bot_mode (mode) VALUES ('public');

-- Tambahan tabel untuk menfess
CREATE TABLE IF NOT EXISTS menfess (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user VARCHAR(255) NOT NULL,
    to_user VARCHAR(255) NOT NULL,
    status ENUM('active', 'done') DEFAULT 'active',
    last_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk optimasi query
ALTER TABLE users ADD INDEX idx_premium (premium);
ALTER TABLE users ADD INDEX idx_banned (banned);
ALTER TABLE group_settings ADD INDEX idx_mute (mute);

-- Tabel untuk kode redeem
CREATE TABLE IF NOT EXISTS redeem_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    reward_type ENUM('coin', 'limit', 'premium') NOT NULL,
    reward_amount INT DEFAULT 0,
    max_claims INT NOT NULL DEFAULT 1,
    current_claims INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NOT NULL,
    CONSTRAINT valid_reward_amount CHECK (reward_amount >= 0),
    CONSTRAINT valid_max_claims CHECK (max_claims >= 1),
    CONSTRAINT valid_current_claims CHECK (current_claims >= 0),
    CONSTRAINT claims_not_exceed CHECK (current_claims <= max_claims)
);

-- Tabel untuk history klaim kode redeem
CREATE TABLE IF NOT EXISTS redeem_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (code_id) REFERENCES redeem_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_claim (code_id, user_id)
);

-- Index untuk optimasi query
ALTER TABLE redeem_codes ADD INDEX idx_code (code);
ALTER TABLE redeem_codes ADD INDEX idx_expired_at (expired_at);
ALTER TABLE redeem_codes ADD INDEX idx_claims (current_claims, max_claims);
ALTER TABLE redeem_history ADD INDEX idx_user_claims (user_id, code_id);