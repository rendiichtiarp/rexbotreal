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