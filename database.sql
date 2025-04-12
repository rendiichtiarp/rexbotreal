-- Tabel users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    uid VARCHAR(255) DEFAULT NULL,
    name VARCHAR(255) DEFAULT NULL,
    password VARCHAR(255) DEFAULT '',
    birth_date DATE DEFAULT NULL,
    birth_date_time BIGINT DEFAULT NULL,
    age INT DEFAULT NULL,
    registered BOOLEAN DEFAULT false,
    coin INT DEFAULT 0,
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
    role ENUM('user','admin') NULL DEFAULT 'user' COLLATE 'ascii_bin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabel group_settings
CREATE TABLE IF NOT EXISTS group_settings (
    id VARCHAR(255) PRIMARY KEY,
    mute BOOLEAN DEFAULT false,
    antistatustag BOOLEAN DEFAULT false,
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

-- Tabel untuk menfess (hapus dan buat ulang tanpa foreign key)
DROP TABLE IF EXISTS menfess;
CREATE TABLE IF NOT EXISTS menfess (
    menfess_id INT AUTO_INCREMENT PRIMARY KEY,
    from_user VARCHAR(255) NOT NULL,
    to_user VARCHAR(255) NOT NULL,
    status ENUM('active', 'done') DEFAULT 'active',
    last_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Index untuk optimasi query menfess
ALTER TABLE menfess ADD INDEX idx_status (status);
ALTER TABLE menfess ADD INDEX idx_users (from_user, to_user);
ALTER TABLE menfess ADD INDEX idx_last_message (last_message);

-- Indexes untuk optimasi query
ALTER TABLE users ADD INDEX idx_premium (premium);
ALTER TABLE users ADD INDEX idx_banned (banned);
ALTER TABLE group_settings ADD INDEX idx_mute (mute);

-- Tabel untuk kode redeem
CREATE TABLE IF NOT EXISTS redeem_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    reward_type ENUM('coin', 'premium') NOT NULL,
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
DROP TABLE IF EXISTS redeem_history;
CREATE TABLE IF NOT EXISTS redeem_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_claim (code_id, user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Index untuk optimasi query
ALTER TABLE redeem_codes ADD INDEX idx_code (code);
ALTER TABLE redeem_codes ADD INDEX idx_expired_at (expired_at);
ALTER TABLE redeem_codes ADD INDEX idx_claims (current_claims, max_claims);
ALTER TABLE redeem_history ADD INDEX idx_user_claims (user_id);
ALTER TABLE redeem_history ADD INDEX idx_code_claims (code_id);

-- Tabel untuk inventori (hapus dan buat ulang tanpa foreign key)
DROP TABLE IF EXISTS inventories;
CREATE TABLE IF NOT EXISTS inventories (
    inv_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_tier ENUM('sampah', 'umum', 'langka', 'sangat_langka', 'epik', 'legenda') NOT NULL,
    quantity INT DEFAULT 1,
    sell_price INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_item (user_id, item_id),
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_sell_price CHECK (sell_price >= 0)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Index untuk optimasi query inventori
ALTER TABLE inventories ADD INDEX idx_user_items (user_id, item_tier);
ALTER TABLE inventories ADD INDEX idx_item_search (item_name);
ALTER TABLE inventories ADD INDEX idx_tier_sort (item_tier, item_name);

-- Tambahkan index untuk optimasi query login
ALTER TABLE users ADD INDEX idx_login (id, password);

CREATE TABLE IF NOT EXISTS shop_items (
    item_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    tier ENUM('sampah', 'umum', 'langka', 'sangat_langka', 'epik', 'legenda') NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_stock CHECK (stock >= 0)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Index untuk optimasi query
ALTER TABLE shop_items ADD INDEX idx_tier_price (tier, price);
ALTER TABLE shop_items ADD INDEX idx_stock (stock);

-- Tabel untuk reset password dan OTP
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tambahkan index untuk optimasi query
CREATE INDEX idx_password_resets_user ON password_resets(user_id);
CREATE INDEX idx_password_resets_otp ON password_resets(otp);
CREATE INDEX idx_password_resets_expires ON password_resets(expires_at);

-- Buat ulang tabel reports dengan struktur yang lebih sederhana
CREATE TABLE IF NOT EXISTS reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_code VARCHAR(10) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'process', 'done', 'rejected') DEFAULT 'pending',
    admin_response TEXT NULL,
    admin_id VARCHAR(255) NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Index untuk optimasi query reports
ALTER TABLE reports ADD INDEX idx_user_reports (user_id);
ALTER TABLE reports ADD INDEX idx_status (status);
ALTER TABLE reports ADD INDEX idx_report_code (report_code);
ALTER TABLE reports ADD INDEX idx_created_at (created_at);

-- Tabel untuk rating bot
CREATE TABLE IF NOT EXISTS bot_ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_rating UNIQUE (user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Index untuk optimasi query ratings
ALTER TABLE bot_ratings ADD INDEX idx_rating_score (rating);
ALTER TABLE bot_ratings ADD INDEX idx_rating_date (created_at);