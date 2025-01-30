CREATE TABLE group_settings (
    group_id VARCHAR(50) PRIMARY KEY,
    welcome BOOLEAN DEFAULT false,
    antilink BOOLEAN DEFAULT false,
    antinsfw BOOLEAN DEFAULT false,
    antisticker BOOLEAN DEFAULT false,
    antitoxic BOOLEAN DEFAULT false,
    autokick BOOLEAN DEFAULT false,
    shalat BOOLEAN DEFAULT false,
    intro BOOLEAN DEFAULT false,
    text_welcome TEXT,
    text_goodbye TEXT,
    text_intro TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);