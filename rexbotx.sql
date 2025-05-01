-- --------------------------------------------------------
-- Host:                         3.1.20.138
-- Server version:               10.11.11-MariaDB-0+deb12u1 - Debian 12
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for rexbotx
CREATE DATABASE IF NOT EXISTS `rexbotx` /*!40100 DEFAULT CHARACTER SET armscii8 COLLATE armscii8_bin */;
USE `rexbotx`;

-- Dumping structure for table rexbotx.bot_mode
CREATE TABLE IF NOT EXISTS `bot_mode` (
  `mode` enum('public','group','private','self') DEFAULT 'public',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.bot_ratings
CREATE TABLE IF NOT EXISTS `bot_ratings` (
  `rating_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `rating` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`rating_id`),
  KEY `idx_rating_score` (`rating`),
  KEY `idx_rating_date` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=120009 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.bot_restart
CREATE TABLE IF NOT EXISTS `bot_restart` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jid` varchar(255) DEFAULT NULL,
  `message_key` longtext DEFAULT NULL,
  `timestamp` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30004 DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.bot_settings
CREATE TABLE IF NOT EXISTS `bot_settings` (
  `price` text DEFAULT NULL,
  `donate` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.group_settings
CREATE TABLE IF NOT EXISTS `group_settings` (
  `id` varchar(255) NOT NULL,
  `mute` tinyint(1) DEFAULT 0,
  `antistatustag` tinyint(1) DEFAULT 0,
  `antilink` tinyint(1) DEFAULT 0,
  `antinsfw` tinyint(1) DEFAULT 0,
  `antispam` tinyint(1) DEFAULT 0,
  `antisticker` tinyint(1) DEFAULT 0,
  `antitoxic` tinyint(1) DEFAULT 0,
  `autokick` tinyint(1) DEFAULT 0,
  `welcome` tinyint(1) DEFAULT 0,
  `intro_text` longtext DEFAULT NULL,
  `welcome_text` longtext DEFAULT NULL,
  `goodbye_text` longtext DEFAULT NULL,
  `spam` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.inventories
CREATE TABLE IF NOT EXISTS `inventories` (
  `inv_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `item_id` varchar(100) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_tier` enum('sampah','umum','langka','sangat_langka','epik','legenda') NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `sell_price` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`inv_id`),
  UNIQUE KEY `unique_item` (`user_id`,`item_id`),
  KEY `idx_user_items` (`user_id`,`item_tier`),
  KEY `idx_item_search` (`item_name`),
  KEY `idx_tier_sort` (`item_tier`,`item_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1200014 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.menfess
CREATE TABLE IF NOT EXISTS `menfess` (
  `menfess_id` int(11) NOT NULL AUTO_INCREMENT,
  `from_user` varchar(255) NOT NULL,
  `to_user` varchar(255) NOT NULL,
  `status` enum('active','done') DEFAULT 'active',
  `last_message` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`menfess_id`),
  KEY `idx_status` (`status`),
  KEY `idx_users` (`from_user`,`to_user`),
  KEY `idx_last_message` (`last_message`)
) ENGINE=InnoDB AUTO_INCREMENT=780020 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.password_resets
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `expires_at` bigint(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_1` (`user_id`),
  KEY `idx_password_resets_user` (`user_id`),
  KEY `idx_password_resets_otp` (`otp`),
  KEY `idx_password_resets_expires` (`expires_at`),
  CONSTRAINT `fk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1350141 DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.rating_comments
CREATE TABLE IF NOT EXISTS `rating_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `rating_id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`comment_id`),
  KEY `idx_rating_comments` (`rating_id`),
  KEY `idx_user_comments` (`user_id`),
  KEY `idx_comment_date` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=60001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.rating_likes
CREATE TABLE IF NOT EXISTS `rating_likes` (
  `like_id` int(11) NOT NULL AUTO_INCREMENT,
  `rating_id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `unique_rating_like` (`rating_id`,`user_id`),
  KEY `idx_rating_likes` (`rating_id`),
  KEY `idx_user_likes` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=60002 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.redeem_codes
CREATE TABLE IF NOT EXISTS `redeem_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `reward_type` enum('coin','premium') NOT NULL,
  `reward_amount` int(11) DEFAULT 0,
  `max_claims` int(11) NOT NULL DEFAULT 1,
  `current_claims` int(11) NOT NULL DEFAULT 0,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `expired_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_expired_at` (`expired_at`),
  KEY `idx_claims` (`current_claims`,`max_claims`)
) ENGINE=InnoDB AUTO_INCREMENT=90003 DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.redeem_history
CREATE TABLE IF NOT EXISTS `redeem_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code_id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `claimed_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_claim` (`code_id`,`user_id`),
  KEY `idx_user_claims` (`user_id`,`code_id`),
  KEY `idx_code_claims` (`code_id`),
  CONSTRAINT `redeem_history_ibfk_1` FOREIGN KEY (`code_id`) REFERENCES `redeem_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `redeem_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=630009 DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.reports
CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `report_code` varchar(10) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','process','done','rejected') DEFAULT 'pending',
  `admin_response` text DEFAULT NULL,
  `admin_id` varchar(255) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `report_code` (`report_code`),
  KEY `idx_user_reports` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_report_code` (`report_code`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=180016 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.shop_items
CREATE TABLE IF NOT EXISTS `shop_items` (
  `item_id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` int(11) NOT NULL,
  `tier` enum('sampah','umum','langka','sangat_langka','epik','legenda') NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `idx_tier_price` (`tier`,`price`),
  KEY `idx_stock` (`stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table rexbotx.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(255) NOT NULL,
  `uid` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL DEFAULT '',
  `birth_date` date DEFAULT NULL,
  `birth_date_time` bigint(20) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `registered` tinyint(1) DEFAULT 0,
  `coin` int(11) DEFAULT 0,
  `xp` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 0,
  `premium` tinyint(1) DEFAULT 0,
  `premium_expired` bigint(20) DEFAULT NULL,
  `banned` tinyint(1) DEFAULT 0,
  `banned_expired` bigint(20) DEFAULT NULL,
  `autolevelup` tinyint(1) DEFAULT 1,
  `afk_reason` text DEFAULT NULL,
  `afk_timestamp` bigint(20) DEFAULT NULL,
  `win_game` int(11) DEFAULT 0,
  `has_sent_banned` tinyint(1) DEFAULT 0,
  `has_sent_cooldown` tinyint(1) DEFAULT 0,
  `has_sent_requireBotGroupMembership` tinyint(1) DEFAULT 0,
  `last_claim_limit` bigint(20) DEFAULT 0,
  `last_claim_daily` bigint(20) DEFAULT 0,
  `last_claim_weekly` bigint(20) DEFAULT 0,
  `last_claim_monthly` bigint(20) DEFAULT 0,
  `last_claim_yearly` bigint(20) DEFAULT 0,
  `lastBeg` bigint(20) DEFAULT 0,
  `lastMineTime` bigint(20) DEFAULT 0,
  `lastWorkTime` bigint(20) DEFAULT 0,
  `lastFishTime` bigint(20) DEFAULT 0,
  `lastScavenge` bigint(20) DEFAULT 0,
  `workStreak` int(11) DEFAULT 0,
  `login_attempts` int(11) DEFAULT 0,
  `last_login_attempt` timestamp NULL DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `rodlevel` enum('bamboo','iron','gold','iridium') DEFAULT 'bamboo',
  `pickaxe` enum('stone','iron','golden','iridium') DEFAULT 'stone',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_login` (`id`,`password`),
  KEY `idx_rodlevel` (`rodlevel`),
  KEY `idx_pickaxe` (`pickaxe`),
  KEY `idx_lastBeg` (`lastBeg`),
  KEY `idx_lastMineTime` (`lastMineTime`),
  KEY `idx_lastWorkTime` (`lastWorkTime`),
  KEY `idx_lastFishTime` (`lastFishTime`),
  KEY `idx_lastScavenge` (`lastScavenge`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COLLATE=ascii_bin;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
