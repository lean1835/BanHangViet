-- =====================================================================================
-- BÁN HÀNG VIỆT - BẢN ĐÓNG GÓI TOÀN BỘ CƠ SỞ DỮ LIỆU KHỞI TẠO TỪ ĐẦU (FULL INIT DATABASE)
-- Tự động sinh bởi Antigravity Engine
-- Khởi tạo từ CSDL số 0, chuẩn hóa 100% Schema (82 bảng) & Dữ liệu Seed mẫu
-- Khớp hoàn toàn cấu trúc Backend (Spring Boot JPA) và vận hành Frontend (React/Vite)
-- =====================================================================================

DROP DATABASE IF EXISTS `ban_hang_viet`;
CREATE DATABASE `ban_hang_viet` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ban_hang_viet`;

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

-- =====================================================================================
-- PHẦN 1: KHỞI TẠO ĐẦY ĐỦ 82 BẢNG HỆ THỐNG (TABLE DDL & CONSTRAINTS)
-- =====================================================================================
DROP TABLE IF EXISTS `accountant_invitations`;
CREATE TABLE `accountant_invitations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accepted_at` datetime(6) DEFAULT NULL,
  `access_duration_days` int NOT NULL,
  `accountant_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountant_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `invitation_expires_at` datetime(6) NOT NULL,
  `invitation_token` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rejected_at` datetime(6) DEFAULT NULL,
  `scope_permissions` json NOT NULL,
  `status` enum('ACCEPTED','EXPIRED','PENDING','REJECTED','REVOKED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `accepted_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invited_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3b0awi5k0k4aj7te95s3rvlwl` (`invitation_token`),
  KEY `idx_accountant_invitations_phone` (`accountant_phone`,`status`),
  KEY `idx_accountant_invitations_token` (`invitation_token`),
  KEY `FKax430byw8jir1qtw0lk5hsx9n` (`accepted_by_user_id`),
  KEY `FK8ow4546ggcmpdv9f1oshvyqqp` (`household_id`),
  KEY `FK2ri3wp20lgw1kw80w5uxpfrsa` (`invited_by_user_id`),
  CONSTRAINT `FK2ri3wp20lgw1kw80w5uxpfrsa` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK8ow4546ggcmpdv9f1oshvyqqp` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKax430byw8jir1qtw0lk5hsx9n` FOREIGN KEY (`accepted_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_table` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` longtext COLLATE utf8mb4_unicode_ci,
  `new_value` longtext COLLATE utf8mb4_unicode_ci,
  `client_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequence_number` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `household_id` (`household_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `anomaly_alerts`;
CREATE TABLE `anomaly_alerts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alert_type` enum('AUDIT_CHAIN_BREACH','LARGE_INVENTORY_ADJUSTMENT','MASS_INVOICE_CANCEL','RAPID_FAILED_LOGINS','UNUSUAL_HIGH_DISCOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `detected_at` datetime(6) NOT NULL,
  `evidence_data` json DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `severity` enum('CRITICAL','INFO','WARNING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DISMISSED','PENDING','REVIEWED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `actor_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewed_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_anomaly_alerts_household_detected` (`household_id`,`detected_at`),
  KEY `idx_anomaly_alerts_household_status` (`household_id`,`status`),
  KEY `idx_anomaly_alerts_actor` (`actor_user_id`),
  KEY `FKptun8srtiqjnwxs1jrth9sd6f` (`reviewed_by_user_id`),
  CONSTRAINT `FK95go6uq8jxtnb767oxqvbv8qf` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKh9ojq2sfpgut4y9awr1rgja57` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKptun8srtiqjnwxs1jrth9sd6f` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `anomaly_rule_configs`;
CREATE TABLE `anomaly_rule_configs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_enabled` bit(1) NOT NULL,
  `rule_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_type` enum('AUDIT_CHAIN_BREACH','LARGE_INVENTORY_ADJUSTMENT','MASS_INVOICE_CANCEL','RAPID_FAILED_LOGINS','UNUSUAL_HIGH_DISCOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('CRITICAL','INFO','WARNING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `threshold_value` decimal(15,2) NOT NULL,
  `time_window_minutes` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_household_rule_type` (`household_id`,`rule_type`),
  KEY `idx_anomaly_rule_configs_household` (`household_id`),
  CONSTRAINT `FKqsf47dtj8goudf7yqy4stcok6` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `app_notifications`;
CREATE TABLE `app_notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_closed` bit(1) NOT NULL,
  `is_read` bit(1) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `severity` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_household_created` (`household_id`,`created_at`),
  KEY `idx_notif_household_type` (`household_id`,`notification_type`),
  KEY `idx_notif_household_unread` (`household_id`,`is_read`),
  KEY `idx_notif_target` (`household_id`,`target_type`,`target_id`),
  KEY `idx_notif_closed` (`household_id`,`is_closed`),
  KEY `FKg64v68jxyvxh8x2ddfktw30n0` (`user_id`),
  CONSTRAINT `FKfqbv0vv2vtc6ye6tqd6wm2yvy` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKg64v68jxyvxh8x2ddfktw30n0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `backup_configs`;
CREATE TABLE `backup_configs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_type` enum('FULL','INVOICES','ORDERS','PRODUCTS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_auto_backup_enabled` bit(1) NOT NULL,
  `retention_count` int NOT NULL,
  `scheduled_time` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKncw3yw947diu7qvqo4c0glxqx` (`household_id`),
  CONSTRAINT `FKn065i9cioe981edhr0av5b7fx` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `backup_histories`;
CREATE TABLE `backup_histories` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_time` datetime(6) NOT NULL,
  `backup_type` enum('FULL','INVOICES','ORDERS','PRODUCTS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger_type` enum('AUTOMATIC','MANUAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKb198hyn2sbf57ajhwa9xlqipg` (`created_by_user_id`),
  KEY `FKr1dg1hra4ml1m69r8am1412b8` (`household_id`),
  CONSTRAINT `FKb198hyn2sbf57ajhwa9xlqipg` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKr1dg1hra4ml1m69r8am1412b8` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `backup_verification_histories`;
CREATE TABLE `backup_verification_histories` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `audit_log_count` int NOT NULL,
  `backup_file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_time` datetime(6) NOT NULL,
  `checked_audit_chain_intact` bit(1) NOT NULL,
  `checked_file_readable` bit(1) NOT NULL,
  `checked_record_counts_matched` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `customer_count` int NOT NULL,
  `execution_duration_ms` bigint NOT NULL,
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `file_size` bigint NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `product_count` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_count` int NOT NULL,
  `trigger_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_count` int NOT NULL,
  `verified_at` datetime(6) NOT NULL,
  `backup_history_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bvh_household_verified` (`household_id`,`verified_at`),
  KEY `idx_bvh_household_status` (`household_id`,`status`),
  KEY `idx_bvh_backup_id` (`backup_history_id`),
  CONSTRAINT `FK209un6rni6g9a0qwect2u3r26` FOREIGN KEY (`backup_history_id`) REFERENCES `backup_histories` (`id`),
  CONSTRAINT `FKbku5s9ucm6mg0j6a0nl84x7iv` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `business_household_settings`;
CREATE TABLE `business_household_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auto_retry_enabled` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `max_retry_attempts` int NOT NULL,
  `max_retry_hours_deadline` int NOT NULL,
  `retry_interval_minutes` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_transfer_timeout_minutes` int NOT NULL,
  `expense_approval_threshold` decimal(15,2) NOT NULL,
  `max_order_holding_hours` int NOT NULL,
  `revenue_warning_threshold_percentage` decimal(5,2) NOT NULL,
  `tax_period_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_reminder_days_before` int NOT NULL,
  `tax_reminder_enabled` bit(1) NOT NULL,
  `shift_difference_threshold` decimal(15,2) NOT NULL,
  `debt_reminder_days_before` int NOT NULL,
  `is_onboarding_completed` bit(1) NOT NULL,
  `is_onboarding_skipped` bit(1) NOT NULL,
  `max_offline_sync_hours` int NOT NULL,
  `return_days_limit` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK728vktabrbmnkq6ig027wp0tk` (`household_id`),
  CONSTRAINT `FKjlrv7f3am93lnanrww6gdkb7s` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `business_households`;
CREATE TABLE `business_households` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tax_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revenue_threshold_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `offline_max_hours` int NOT NULL,
  `offline_max_orders` int NOT NULL,
  `session_timeout_minutes` int NOT NULL,
  `rounding_rule` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lock_reason` text COLLATE utf8mb4_unicode_ci,
  `locked_at` datetime(6) DEFAULT NULL,
  `locked_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','LOCKED') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_household_tax_code` (`tax_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_transaction_categories`;
CREATE TABLE `cash_transaction_categories` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` bit(1) NOT NULL,
  `is_system_default` bit(1) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('EXPENSE','INCOME') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ctc_household_name_type` (`household_id`,`name`,`type`),
  CONSTRAINT `FKi5r54y7jmadaqw2dr6xibugjc` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_transactions`;
CREATE TABLE `cash_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `person_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('APPROVED','CANCELLED','PENDING_APPROVAL','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('EXPENSE','INCOME') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `approved_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9wbgekr7s6oqscwufn5xygur8` (`approved_by_user_id`),
  KEY `FKau0byc5d01e3u1fxmdmgqui04` (`category_id`),
  KEY `FKo42cqn0px7txo93twtll2b6ns` (`created_by_user_id`),
  KEY `FKxfm2dof7dmb39rccsrj0lgek` (`household_id`),
  KEY `FK9p5a80xos64nbr7iac86se1c6` (`shift_id`),
  CONSTRAINT `FK9p5a80xos64nbr7iac86se1c6` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`),
  CONSTRAINT `FK9wbgekr7s6oqscwufn5xygur8` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKau0byc5d01e3u1fxmdmgqui04` FOREIGN KEY (`category_id`) REFERENCES `cash_transaction_categories` (`id`),
  CONSTRAINT `FKo42cqn0px7txo93twtll2b6ns` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKxfm2dof7dmb39rccsrj0lgek` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_debt_reconciliation_items`;
CREATE TABLE `customer_debt_reconciliation_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `reference_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `running_balance` decimal(15,2) NOT NULL,
  `transaction_date` datetime(6) NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_debt_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reconciliation_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcyykdpvclhgw62tt09gtayoel` (`customer_debt_id`),
  KEY `FKkcjcxdhc057v4t2etxdbyrcbs` (`reconciliation_id`),
  CONSTRAINT `FKcyykdpvclhgw62tt09gtayoel` FOREIGN KEY (`customer_debt_id`) REFERENCES `customer_debts` (`id`),
  CONSTRAINT `FKkcjcxdhc057v4t2etxdbyrcbs` FOREIGN KEY (`reconciliation_id`) REFERENCES `customer_debt_reconciliations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_debt_reconciliations`;
CREATE TABLE `customer_debt_reconciliations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `closing_debt_balance` decimal(15,2) NOT NULL,
  `closing_debt_in_words` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `confirmed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `end_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `opening_debt_balance` decimal(15,2) NOT NULL,
  `reconciled_to_date` date DEFAULT NULL,
  `start_date` date NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_debt_incurred` decimal(15,2) NOT NULL,
  `total_debt_paid` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `confirmed_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6iyfy5w5ocxet90ui9mvssc8r` (`confirmed_by_user_id`),
  KEY `FKdehapbu7ispitcx21tguod6ck` (`created_by_user_id`),
  KEY `FKr0gq54a835rvk763wjupthlun` (`customer_id`),
  KEY `FKg1ebvuhjs4d4tsu96e1yl2xu` (`household_id`),
  CONSTRAINT `FK6iyfy5w5ocxet90ui9mvssc8r` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdehapbu7ispitcx21tguod6ck` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKg1ebvuhjs4d4tsu96e1yl2xu` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKr0gq54a835rvk763wjupthlun` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_debts`;
CREATE TABLE `customer_debts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `due_date` timestamp NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remaining_amount` decimal(15,2) NOT NULL,
  `reminder_sent` tinyint(1) NOT NULL DEFAULT '0',
  `overdue_reminder_sent` tinyint(1) NOT NULL DEFAULT '0',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `reconciliation_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `household_id` (`household_id`),
  KEY `order_id` (`order_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_customer_debts_lookup` (`customer_id`,`status`),
  KEY `idx_customer_debts_due` (`due_date`),
  KEY `FKhc8w5cqw45iaeryqv2mt51hmi` (`reconciliation_id`),
  CONSTRAINT `customer_debts_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_debts_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_debts_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customer_debts_ibfk_4` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FKhc8w5cqw45iaeryqv2mt51hmi` FOREIGN KEY (`reconciliation_id`) REFERENCES `customer_debt_reconciliations` (`id`),
  CONSTRAINT `chk_debt_amount` CHECK ((`amount` <> 0.00)),
  CONSTRAINT `chk_debt_status` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'PAID',_utf8mb4'OVERDUE'))),
  CONSTRAINT `chk_debt_type` CHECK ((`type` in (_utf8mb4'DEBT_CREATED',_utf8mb4'DEBT_PAID')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_point_transactions`;
CREATE TABLE `customer_point_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance_after` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `monetary_equivalent` decimal(15,2) NOT NULL,
  `points_change` int NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_ticket_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcrvw18g86525hpbvqi4sfedtx` (`created_by_user_id`),
  KEY `FKiyky5rvqcnb9v3ies53s47cdl` (`customer_id`),
  KEY `FKk4a3hpe2t1ub8lhk4h4c0cg2w` (`household_id`),
  KEY `FKe73kiyfurwaambayeppvdbpd6` (`order_id`),
  KEY `FK7m5794h8pcb6t45qjo5xlm7ra` (`return_ticket_id`),
  CONSTRAINT `FK7m5794h8pcb6t45qjo5xlm7ra` FOREIGN KEY (`return_ticket_id`) REFERENCES `return_tickets` (`id`),
  CONSTRAINT `FKcrvw18g86525hpbvqi4sfedtx` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKe73kiyfurwaambayeppvdbpd6` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKiyky5rvqcnb9v3ies53s47cdl` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FKk4a3hpe2t1ub8lhk4h4c0cg2w` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_limit` decimal(15,2) NOT NULL DEFAULT '0.00',
  `current_debt` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `reminder_days_before` int NOT NULL DEFAULT '3',
  `reminder_days_after` int NOT NULL DEFAULT '3',
  `discount_rate` decimal(5,2) NOT NULL,
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_vip` bit(1) NOT NULL,
  `total_spent` decimal(15,2) NOT NULL,
  `tax_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_delivery_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_delivery_channel` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_reconciled_date` date DEFAULT NULL,
  `loyalty_points` int NOT NULL,
  `last_reconciliation_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_phone_per_household` (`household_id`,`phone_number`),
  KEY `FKqkrd322h28rwnrqyo9yojjm23` (`last_reconciliation_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FKqkrd322h28rwnrqyo9yojjm23` FOREIGN KEY (`last_reconciliation_id`) REFERENCES `customer_debt_reconciliations` (`id`),
  CONSTRAINT `chk_cust_credit_limit` CHECK ((`credit_limit` >= 0.00)),
  CONSTRAINT `chk_cust_current_debt` CHECK ((`current_debt` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `dining_tables`;
CREATE TABLE `dining_tables` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seat_capacity` int NOT NULL,
  `sort_order` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqek1mi1ctowefa7n5vqym827g` (`household_id`),
  CONSTRAINT `FKqek1mi1ctowefa7n5vqym827g` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `e_invoice_items`;
CREATE TABLE `e_invoice_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `tax_rate_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `promotion_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `promotion_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `product_id` (`product_id`),
  KEY `FK6j7q05b088r6sek738sameoy6` (`promotion_id`),
  CONSTRAINT `e_invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `e_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `e_invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK6j7q05b088r6sek738sameoy6` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `e_invoices`;
CREATE TABLE `e_invoices` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `canceled_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_pattern` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buyer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_tax_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount_before_tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `tax_authority_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_authority_response` text COLLATE utf8mb4_unicode_ci,
  `cancel_reason` text COLLATE utf8mb4_unicode_ci,
  `lookup_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_to_tax_at` timestamp NULL DEFAULT NULL,
  `tax_response_at` timestamp NULL DEFAULT NULL,
  `canceled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `footer_note` text COLLATE utf8mb4_unicode_ci,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `return_ticket_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_category` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_retry_at` datetime(6) DEFAULT NULL,
  `max_retry_count` int DEFAULT NULL,
  `next_retry_at` datetime(6) DEFAULT NULL,
  `retry_count` int NOT NULL,
  `is_error_notified` bit(1) NOT NULL,
  `payment_method` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_delivery_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `point_discount_amount` decimal(15,2) NOT NULL,
  `points_redeemed` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_lookup_code` (`lookup_code`),
  UNIQUE KEY `uq_invoice_tax_auth_code` (`tax_authority_code`),
  KEY `order_id` (`order_id`),
  KEY `original_invoice_id` (`original_invoice_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `canceled_by_user_id` (`canceled_by_user_id`),
  KEY `idx_e_invoices_household_number` (`household_id`,`invoice_number`),
  KEY `idx_e_invoices_lookup` (`lookup_code`),
  KEY `idx_e_invoices_status` (`status`),
  KEY `FK6y64qfndkm0nvw80rki545t7p` (`return_ticket_id`),
  KEY `idx_invoices_auto_retry` (`status`,`next_retry_at`,`retry_count`),
  CONSTRAINT `e_invoices_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `e_invoices_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `e_invoices_ibfk_3` FOREIGN KEY (`original_invoice_id`) REFERENCES `e_invoices` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `e_invoices_ibfk_4` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `e_invoices_ibfk_5` FOREIGN KEY (`canceled_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK6y64qfndkm0nvw80rki545t7p` FOREIGN KEY (`return_ticket_id`) REFERENCES `return_tickets` (`id`),
  CONSTRAINT `chk_cancel_reason` CHECK ((((`status` = _utf8mb4'CANCELED') and (`cancel_reason` is not null) and (`canceled_at` is not null) and (`canceled_by_user_id` is not null)) or (`status` <> _utf8mb4'CANCELED'))),
  CONSTRAINT `chk_inv_discount` CHECK ((`discount_amount` >= 0.00)),
  CONSTRAINT `chk_inv_final` CHECK ((`final_amount` >= 0.00)),
  CONSTRAINT `chk_inv_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'WAITING_TAX_CODE',_utf8mb4'ISSUED',_utf8mb4'SEND_ERROR',_utf8mb4'ADJUSTED',_utf8mb4'CANCELED',_utf8mb4'MANUAL_PROCESSING'))),
  CONSTRAINT `chk_inv_tax` CHECK ((`tax_amount` >= 0.00)),
  CONSTRAINT `chk_inv_total_before` CHECK ((`total_amount_before_tax` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `faq_items`;
CREATE TABLE `faq_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('ACCOUNT','DATA','INVOICE','SALES') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `display_order` int NOT NULL,
  `is_active` bit(1) NOT NULL,
  `keywords` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `question` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `view_count` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_faq_category` (`category`),
  KEY `idx_faq_is_active` (`is_active`),
  KEY `idx_faq_order` (`category`,`display_order`),
  KEY `idx_faq_view_count` (`view_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `goods_receipt_details`;
CREATE TABLE `goods_receipt_details` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `receipt_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `base_purchase_price` decimal(15,2) DEFAULT NULL,
  `base_quantity` decimal(12,3) DEFAULT NULL,
  `conversion_factor` decimal(12,3) DEFAULT NULL,
  `unit_conversion_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `receipt_id` (`receipt_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `goods_receipt_details_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipt_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_receipt_detail_price` CHECK ((`purchase_price` >= 0.00)),
  CONSTRAINT `chk_receipt_detail_qty` CHECK ((`quantity` > 0.000))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `goods_receipts`;
CREATE TABLE `goods_receipts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `received_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `supplier_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_goods_receipt_number` (`receipt_number`),
  KEY `household_id` (`household_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `FKwn1cuunwpj2pd38ndi4etqg6` (`supplier_id`),
  CONSTRAINT `FKwn1cuunwpj2pd38ndi4etqg6` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `goods_receipts_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipts_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `household_accountant_assignments`;
CREATE TABLE `household_accountant_assignments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `revoke_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `scope_permissions` json NOT NULL,
  `status` enum('ACTIVE','EXPIRED','REVOKED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `accountant_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invitation_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_household_accountant` (`household_id`,`accountant_user_id`),
  KEY `idx_accountant_assignments_user` (`accountant_user_id`,`status`),
  KEY `idx_accountant_assignments_household` (`household_id`,`status`),
  KEY `FKp464xuvqo4d0ep6xptxse2pui` (`invitation_id`),
  KEY `FK4rsyyotxsamhfc8p3q1ydnvqv` (`revoked_by_user_id`),
  CONSTRAINT `FK4rsyyotxsamhfc8p3q1ydnvqv` FOREIGN KEY (`revoked_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK58s1rq194w5dvb1ewq9o55e7w` FOREIGN KEY (`accountant_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKbmaweuys451sbj7c4u82swlbi` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKp464xuvqo4d0ep6xptxse2pui` FOREIGN KEY (`invitation_id`) REFERENCES `accountant_invitations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `household_subscriptions`;
CREATE TABLE `household_subscriptions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `end_date` date NOT NULL,
  `start_date` date NOT NULL,
  `status` enum('ACTIVE','CANCELLED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `assigned_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_household_subscriptions_household` (`household_id`,`status`),
  KEY `FK16p4pnxs6g4s8w5n9jqau0gm7` (`assigned_by_user_id`),
  KEY `FK8w5j8bc9rchm59hg3iuvr8l68` (`package_id`),
  CONSTRAINT `FK16p4pnxs6g4s8w5n9jqau0gm7` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK8w5j8bc9rchm59hg3iuvr8l68` FOREIGN KEY (`package_id`) REFERENCES `service_packages` (`id`),
  CONSTRAINT `FKeclqypi43lmruoe0gf89fcdy0` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `household_usage_stats`;
CREATE TABLE `household_usage_stats` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `current_pos_count` int NOT NULL,
  `current_users_count` int NOT NULL,
  `invoices_issued_count` int NOT NULL,
  `is_invoice_over_quota` bit(1) NOT NULL,
  `month_year` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `over_quota_invoice_count` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_household_month_usage` (`household_id`,`month_year`),
  KEY `idx_household_usage_month` (`household_id`,`month_year`),
  CONSTRAINT `FKj9a8evjovjl982mingx1m7iyi` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_audit_details`;
CREATE TABLE `inventory_audit_details` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actual_quantity` decimal(12,3) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `difference_quantity` decimal(12,3) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `system_quantity` decimal(12,3) NOT NULL,
  `audit_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK7jqxm9g204iab0tyoknrxnnnd` (`audit_id`),
  KEY `FKll5g33ublboxb52399ep3hvv` (`product_id`),
  CONSTRAINT `FK7jqxm9g204iab0tyoknrxnnnd` FOREIGN KEY (`audit_id`) REFERENCES `inventory_audits` (`id`),
  CONSTRAINT `FKll5g33ublboxb52399ep3hvv` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_audits`;
CREATE TABLE `inventory_audits` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `audit_date` datetime(6) NOT NULL,
  `audit_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_difference_qty` decimal(12,3) NOT NULL,
  `total_items` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKc5jmrf5l4la6cyj7jetbucdj6` (`audit_number`),
  KEY `FK2s2r1uxv91jp47r41pus5wopj` (`created_by_user_id`),
  KEY `FKqcq6s2fj1ql98cwtlms3e8220` (`household_id`),
  CONSTRAINT `FK2s2r1uxv91jp47r41pus5wopj` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqcq6s2fj1ql98cwtlms3e8220` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_delivery_logs`;
CREATE TABLE `invoice_delivery_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `invoice_delivery_logs_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `e_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_delivery_channel` CHECK ((`channel` in (_utf8mb4'QR',_utf8mb4'EMAIL',_utf8mb4'ZALO',_utf8mb4'PRINT'))),
  CONSTRAINT `chk_delivery_status` CHECK ((`status` in (_utf8mb4'SUCCESS',_utf8mb4'FAILED',_utf8mb4'PENDING')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_error_notice_items`;
CREATE TABLE `invoice_error_notice_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `handling_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_pattern` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_symbol` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_authority_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notice_item` (`notice_id`,`invoice_id`),
  KEY `idx_notice_item_inv` (`invoice_id`),
  CONSTRAINT `FK1w6y2noh0koi16s6sgysmi56e` FOREIGN KEY (`invoice_id`) REFERENCES `e_invoices` (`id`),
  CONSTRAINT `FK35jqifpj6397g8qegjtdo5v1v` FOREIGN KEY (`notice_id`) REFERENCES `invoice_error_notices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_error_notices`;
CREATE TABLE `invoice_error_notices` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `notice_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notice_place` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notice_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_to_tax_at` datetime(6) DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_authority_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_authority_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_authority_response` text COLLATE utf8mb4_unicode_ci,
  `tax_response_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqltabvav3hlph0xhpsj0xiom9` (`notice_code`),
  KEY `idx_notice_household` (`household_id`),
  KEY `FK4oryb8homkhrqan2s4m1jekhi` (`created_by_user_id`),
  CONSTRAINT `FK4oryb8homkhrqan2s4m1jekhi` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKbclldbgwkqr9hmo92p4h3nsag` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_number_ranges`;
CREATE TABLE `invoice_number_ranges` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `current_number` int NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `end_number` int NOT NULL,
  `invoice_pattern` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_number` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `warning_threshold` int NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1t81eoumdi9efo35dktl2aouw` (`household_id`),
  CONSTRAINT `FK1t81eoumdi9efo35dktl2aouw` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_status_logs`;
CREATE TABLE `invoice_status_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `changed_by_user_id` (`changed_by_user_id`),
  CONSTRAINT `invoice_status_logs_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `e_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_status_logs_ibfk_2` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_templates`;
CREATE TABLE `invoice_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_pattern` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HÓA ĐƠN BÁN HÀNG',
  `footer_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_household_template` (`household_id`),
  CONSTRAINT `invoice_templates_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `loyalty_program_configs`;
CREATE TABLE `loyalty_program_configs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_enabled` bit(1) NOT NULL,
  `max_redeem_rate_per_order` decimal(5,2) NOT NULL,
  `min_points_to_redeem` int NOT NULL,
  `point_expiry_days` int NOT NULL,
  `point_value` decimal(15,2) NOT NULL,
  `spend_amount_per_point` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKp2ubdkm1jd657ft35p0k8xem7` (`household_id`),
  CONSTRAINT `FKa6t21rbjmyqlpffvadkrmc2rl` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `order_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax_rate_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `promotion_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `promotion_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_quantity` decimal(12,3) DEFAULT NULL,
  `conversion_factor` decimal(12,3) DEFAULT NULL,
  `price_tier_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rounding_difference` decimal(15,2) NOT NULL,
  `unit_conversion_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_tier_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost_price` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `FKl3adxjx6wguwap1i5fl8yvi8a` (`promotion_id`),
  KEY `FK6n2e1g4pnqdaitgupreef7rgj` (`price_tier_id`),
  CONSTRAINT `FK6n2e1g4pnqdaitgupreef7rgj` FOREIGN KEY (`price_tier_id`) REFERENCES `product_price_tiers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FKl3adxjx6wguwap1i5fl8yvi8a` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_item_discount` CHECK ((`discount_amount` >= 0.00)),
  CONSTRAINT `chk_item_quantity` CHECK ((`quantity` > 0.000)),
  CONSTRAINT `chk_item_tax_amt` CHECK ((`tax_amount` >= 0.00)),
  CONSTRAINT `chk_item_tax_pct` CHECK ((`tax_rate_percentage` >= 0.00)),
  CONSTRAINT `chk_item_unit_price` CHECK ((`unit_price` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `order_payments`;
CREATE TABLE `order_payments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `amount_given` decimal(15,2) DEFAULT NULL,
  `change_amount` decimal(15,2) DEFAULT NULL,
  `confirmed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_confirmed` bit(1) NOT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `confirmed_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9nwi4crajfapwp7twyjik08p2` (`confirmed_by_user_id`),
  KEY `FKwqk5ij5u64dijfs343c29rvq` (`household_id`),
  KEY `FK3s9vxneb3dk3plhpv9s213so0` (`order_id`),
  CONSTRAINT `FK3s9vxneb3dk3plhpv9s213so0` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FK9nwi4crajfapwp7twyjik08p2` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKwqk5ij5u64dijfs343c29rvq` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASH',
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CREATING',
  `sync_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SYNCED',
  `is_offline` tinyint(1) NOT NULL DEFAULT '0',
  `synced_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `discount_rate_or_value` decimal(15,2) DEFAULT NULL,
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `point_of_sale_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_discount_amount` decimal(15,2) NOT NULL,
  `promotion_discount_amount` decimal(15,2) NOT NULL,
  `cancel_reason` enum('CUSTOMER_CHANGED_MIND','OTHER','OUT_OF_STOCK','STAFF_INPUT_ERROR') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancel_reason_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `canceled_at` datetime(6) DEFAULT NULL,
  `order_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `canceled_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dining_table_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `point_discount_amount` decimal(15,2) NOT NULL,
  `points_earned` int NOT NULL,
  `points_redeemed` int NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_number` (`order_number`),
  KEY `household_id` (`household_id`),
  KEY `shift_id` (`shift_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `customer_id` (`customer_id`),
  KEY `FK583893of90jujvn8i1t6qu468` (`point_of_sale_id`),
  KEY `FK41l5i2riykry3gc09h3nde1j6` (`canceled_by_user_id`),
  KEY `FK3rxwvdtky3hyanrwe6w7dia4j` (`dining_table_id`),
  CONSTRAINT `FK3rxwvdtky3hyanrwe6w7dia4j` FOREIGN KEY (`dining_table_id`) REFERENCES `dining_tables` (`id`),
  CONSTRAINT `FK41l5i2riykry3gc09h3nde1j6` FOREIGN KEY (`canceled_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK583893of90jujvn8i1t6qu468` FOREIGN KEY (`point_of_sale_id`) REFERENCES `points_of_sale` (`id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_order_discount` CHECK ((`discount_amount` >= 0.00)),
  CONSTRAINT `chk_order_final` CHECK ((`final_amount` >= 0.00)),
  CONSTRAINT `chk_order_payment_method` CHECK ((`payment_method` in (_utf8mb4'CASH',_utf8mb4'BANK_TRANSFER',_utf8mb4'DEBT',_utf8mb4'COMBINED'))),
  CONSTRAINT `chk_order_payment_status` CHECK ((`payment_status` in (_utf8mb4'PENDING',_utf8mb4'PAID',_utf8mb4'DEBT'))),
  CONSTRAINT `chk_order_status` CHECK ((`status` in (_utf8mb4'CREATING',_utf8mb4'COMPLETED',_utf8mb4'CANCELED'))),
  CONSTRAINT `chk_order_sync_status` CHECK ((`sync_status` in (_utf8mb4'SYNCED',_utf8mb4'PENDING',_utf8mb4'CONFLICTED'))),
  CONSTRAINT `chk_order_total` CHECK ((`total_amount` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset_otps`;
CREATE TABLE `password_reset_otps` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt_count` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expiry_time` datetime(6) NOT NULL,
  `is_used` bit(1) NOT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pwd_reset_lookup` (`phone_number`,`is_used`,`created_at`),
  KEY `FK9c75odu4o05pvbvhn2n9ia0tj` (`user_id`),
  KEY `idx_pwd_reset_email_lookup` (`email`,`type`,`is_used`,`created_at`),
  CONSTRAINT `FK9c75odu4o05pvbvhn2n9ia0tj` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `platform_incidents`;
CREATE TABLE `platform_incidents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `affected_households_count` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `error_threshold_count` int NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `severity` enum('CRITICAL','ERROR','INFO','WARNING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime(6) NOT NULL,
  `status` enum('IDENTIFIED','INVESTIGATING','MONITORING','RESOLVED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_platform_incidents_status` (`status`,`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `platform_system_logs`;
CREATE TABLE `platform_system_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `error_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_widespread_incident` bit(1) NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `severity` enum('CRITICAL','ERROR','INFO','WARNING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `incident_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_platform_logs_severity_created` (`severity`,`created_at`),
  KEY `idx_platform_logs_household` (`household_id`,`created_at`),
  KEY `idx_platform_logs_event_type` (`event_type`,`created_at`),
  KEY `FK1jcrstjpbk44y05xtcev2uj5j` (`incident_id`),
  CONSTRAINT `FK1jcrstjpbk44y05xtcev2uj5j` FOREIGN KEY (`incident_id`) REFERENCES `platform_incidents` (`id`),
  CONSTRAINT `FKokmkrqfvcfqeman6r1gi70p21` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `points_of_sale`;
CREATE TABLE `points_of_sale` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `invoice_symbol` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_default` bit(1) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pos_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pos_household_status` (`household_id`,`is_active`,`deleted_at`),
  KEY `idx_pos_household_default` (`household_id`,`is_default`),
  CONSTRAINT `FK4dg1s0s5dotga7n04lskf87s8` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pos_inventories`;
CREATE TABLE `pos_inventories` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `min_stock_quantity` decimal(12,3) NOT NULL,
  `stock_quantity` decimal(12,3) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `point_of_sale_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pos_product` (`point_of_sale_id`,`product_id`),
  KEY `idx_pos_inventories_household_pos` (`household_id`,`point_of_sale_id`),
  KEY `idx_pos_inventories_product` (`product_id`),
  CONSTRAINT `FK10vnwnmgo45nrou8ly68pwwd5` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKmq3v4fvo1w7pu0dsw0k8di06b` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKontqgfvh7gj08n7fh2yoj64t2` FOREIGN KEY (`point_of_sale_id`) REFERENCES `points_of_sale` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pos_transfer_items`;
CREATE TABLE `pos_transfer_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pos_transfer_items_transfer` (`transfer_id`),
  KEY `idx_pos_transfer_items_product` (`product_id`),
  CONSTRAINT `FKe92x0m7nlx6j2iyg37b3ww1iu` FOREIGN KEY (`transfer_id`) REFERENCES `pos_transfers` (`id`),
  CONSTRAINT `FKs73ut7qrqixg02pikukjsxp3c` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pos_transfers`;
CREATE TABLE `pos_transfers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cancel_reason` text COLLATE utf8mb4_unicode_ci,
  `canceled_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `received_at` datetime(6) DEFAULT NULL,
  `status` enum('CANCELED','COMPLETED','IN_TRANSIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_items` int NOT NULL,
  `total_quantity` decimal(12,3) NOT NULL,
  `transfer_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transferred_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `canceled_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_point_of_sale_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `received_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_point_of_sale_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKlfqw7ixm4tkdtxrlvcy7866k9` (`transfer_number`),
  KEY `idx_pos_transfers_household` (`household_id`,`status`,`transferred_at`),
  KEY `idx_pos_transfers_from_pos` (`from_point_of_sale_id`),
  KEY `idx_pos_transfers_to_pos` (`to_point_of_sale_id`),
  KEY `FK78ibh1mr7vcrugf4eoio5ukdm` (`canceled_by_user_id`),
  KEY `FK6ssfou4cwhpvpntbd8so2dngr` (`created_by_user_id`),
  KEY `FKrffjk6ysni9pvcbqunv9xg16r` (`received_by_user_id`),
  CONSTRAINT `FK6ssfou4cwhpvpntbd8so2dngr` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK78ibh1mr7vcrugf4eoio5ukdm` FOREIGN KEY (`canceled_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKllpq3wkl2bivgiwru8blyipnw` FOREIGN KEY (`from_point_of_sale_id`) REFERENCES `points_of_sale` (`id`),
  CONSTRAINT `FKrffjk6ysni9pvcbqunv9xg16r` FOREIGN KEY (`received_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrr1b9vtnabxt4bohufcciueto` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKt4r4tbn0cr625kwyrnyfq00me` FOREIGN KEY (`to_point_of_sale_id`) REFERENCES `points_of_sale` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `price_adjustment_batches`;
CREATE TABLE `price_adjustment_batches` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_type` enum('FIXED_AMOUNT','PERCENTAGE','PROFIT_MARGIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_value` decimal(15,2) NOT NULL,
  `applied_at` datetime(6) NOT NULL,
  `applied_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `below_cost_items` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revert_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reverted_at` datetime(6) DEFAULT NULL,
  `reverted_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rounding_method` enum('NONE','ROUND_TO_100','ROUND_TO_1000','ROUND_TO_500') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('APPLIED','REVERTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_group_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_items` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `price_adjustment_items`;
CREATE TABLE `price_adjustment_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_price` decimal(15,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_below_cost` bit(1) NOT NULL,
  `new_price` decimal(15,2) NOT NULL,
  `old_price` decimal(15,2) NOT NULL,
  `price_difference` decimal(15,2) NOT NULL,
  `batch_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9p06r5sq68ghnf22kqmcd0mcm` (`batch_id`),
  KEY `FKem957jfge2d56nrvtqthpm9h9` (`product_id`),
  CONSTRAINT `FK9p06r5sq68ghnf22kqmcd0mcm` FOREIGN KEY (`batch_id`) REFERENCES `price_adjustment_batches` (`id`),
  CONSTRAINT `FKem957jfge2d56nrvtqthpm9h9` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_exchange_items`;
CREATE TABLE `product_exchange_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `invoice_item_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `tax_rate_percentage` decimal(5,2) NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `exchange_ticket_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKo91vv7nw3vg9f7ie0p5viaq5d` (`exchange_ticket_id`),
  KEY `FKgpvou7a47echmfc0c4fea2lg0` (`product_id`),
  CONSTRAINT `FKgpvou7a47echmfc0c4fea2lg0` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKo91vv7nw3vg9f7ie0p5viaq5d` FOREIGN KEY (`exchange_ticket_id`) REFERENCES `product_exchange_tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_exchange_tickets`;
CREATE TABLE `product_exchange_tickets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `difference_amount` decimal(15,2) NOT NULL,
  `exchange_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `extra_payment_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_exchange_amount` decimal(15,2) NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `additional_invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_order_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pet_household_ticket` (`household_id`,`ticket_number`),
  KEY `FKp5vf740jvorfoevhxdyimglqx` (`additional_invoice_id`),
  KEY `FK6wpdd26g5oko6hswifbbs1aek` (`created_by_user_id`),
  KEY `FK7aoic9b28xxweh2a1oy480r2t` (`customer_id`),
  KEY `FKc5mtitjeqhucqxeh7ee60dnv7` (`original_invoice_id`),
  KEY `FK1htll3h8orx5sto4cnxbp83ae` (`original_order_id`),
  CONSTRAINT `FK1htll3h8orx5sto4cnxbp83ae` FOREIGN KEY (`original_order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FK6wpdd26g5oko6hswifbbs1aek` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK7aoic9b28xxweh2a1oy480r2t` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FKc5mtitjeqhucqxeh7ee60dnv7` FOREIGN KEY (`original_invoice_id`) REFERENCES `e_invoices` (`id`),
  CONSTRAINT `FKo27rx5xnliw6n7lg6d9n97jga` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKp5vf740jvorfoevhxdyimglqx` FOREIGN KEY (`additional_invoice_id`) REFERENCES `e_invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_groups`;
CREATE TABLE `product_groups` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `household_id` (`household_id`),
  CONSTRAINT `product_groups_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_price_tiers`;
CREATE TABLE `product_price_tiers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `max_quantity` decimal(12,3) DEFAULT NULL,
  `min_quantity` decimal(12,3) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `tier_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_conversion_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8qrh07th8wabc1iv9m1dvy4m9` (`household_id`),
  KEY `FK5exrpb1k34gh17d7gdy13x1sy` (`product_id`),
  KEY `FK4p4les075qw8k3vqsldfiktr9` (`unit_conversion_id`),
  CONSTRAINT `FK4p4les075qw8k3vqsldfiktr9` FOREIGN KEY (`unit_conversion_id`) REFERENCES `product_unit_conversions` (`id`),
  CONSTRAINT `FK5exrpb1k34gh17d7gdy13x1sy` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FK8qrh07th8wabc1iv9m1dvy4m9` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_unit_conversions`;
CREATE TABLE `product_unit_conversions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conversion_factor` decimal(12,3) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_default_import` bit(1) NOT NULL,
  `is_default_sale` bit(1) NOT NULL,
  `price` decimal(15,2) DEFAULT NULL,
  `unit_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_unit_name` (`product_id`,`unit_name`),
  KEY `idx_puc_product_id` (`product_id`),
  KEY `idx_puc_barcode` (`barcode`),
  CONSTRAINT `FK5a472pbcv5hienkdnm2s18cc6` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_rate_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `stock_quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `cost_price` decimal(15,2) NOT NULL,
  `min_stock_quantity` decimal(12,3) NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decimal_places` int NOT NULL,
  `initial_stock_quantity` decimal(12,3) DEFAULT NULL,
  `is_sold_by_weight` bit(1) NOT NULL,
  `min_weight_step` decimal(12,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  KEY `tax_rate_id` (`tax_rate_id`),
  KEY `idx_products_household_sku` (`household_id`,`sku`),
  KEY `idx_products_name` (`name`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `product_groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rates` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_product_price` CHECK ((`price` >= 0.00)),
  CONSTRAINT `chk_product_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `promotion_product_groups`;
CREATE TABLE `promotion_product_groups` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_group_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotion_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_product_group` (`promotion_id`,`product_group_id`),
  KEY `FKm1nev1ntqp5ovym8jdey19tnq` (`product_group_id`),
  CONSTRAINT `FKm1nev1ntqp5ovym8jdey19tnq` FOREIGN KEY (`product_group_id`) REFERENCES `product_groups` (`id`),
  CONSTRAINT `FKpeyotwjwt01dfn1j29c08o4gf` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `promotion_products`;
CREATE TABLE `promotion_products` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotion_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_product` (`promotion_id`,`product_id`),
  KEY `FK9rm5m4rnoamh56kxetmoe1kk9` (`product_id`),
  CONSTRAINT `FK9rm5m4rnoamh56kxetmoe1kk9` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKkn7hllhf1o8jjrolro4rqmxt7` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apply_scope` enum('ALL','PRODUCT','PRODUCT_GROUP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('CASH','FIXED_AMOUNT','PERCENTAGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(15,2) NOT NULL,
  `end_date` datetime(6) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime(6) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKf7dr7w187y8342v4tvgvnf24w` (`created_by_user_id`),
  KEY `FKnkmg9k46j3p2mf9p4d6l5awu5` (`household_id`),
  CONSTRAINT `FKf7dr7w187y8342v4tvgvnf24w` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKnkmg9k46j3p2mf9p4d6l5awu5` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `restore_histories`;
CREATE TABLE `restore_histories` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_type` enum('FULL','INVOICES','ORDERS','PRODUCTS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `restored_at` datetime(6) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_history_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `restored_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfo83gwtdpdfydm5mpjupgb8el` (`backup_history_id`),
  KEY `FKn7cqbfpcjot3uinegkq640sab` (`household_id`),
  KEY `FK3fa8prfpc2cj1q29lafi9q3qn` (`restored_by_user_id`),
  CONSTRAINT `FK3fa8prfpc2cj1q29lafi9q3qn` FOREIGN KEY (`restored_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKfo83gwtdpdfydm5mpjupgb8el` FOREIGN KEY (`backup_history_id`) REFERENCES `backup_histories` (`id`),
  CONSTRAINT `FKn7cqbfpcjot3uinegkq640sab` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `return_ticket_items`;
CREATE TABLE `return_ticket_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `invoice_item_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `tax_rate_percentage` decimal(5,2) NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_ticket_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6dyno8prppxqh1kttkoikifym` (`product_id`),
  KEY `FKpdfnkub8hgqicb2eqrc3i7146` (`return_ticket_id`),
  CONSTRAINT `FK6dyno8prppxqh1kttkoikifym` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKpdfnkub8hgqicb2eqrc3i7146` FOREIGN KEY (`return_ticket_id`) REFERENCES `return_tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `return_tickets`;
CREATE TABLE `return_tickets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `refund_payment_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reject_reason` text COLLATE utf8mb4_unicode_ci,
  `rejected_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `approved_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_order_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points_deducted` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKc0q0vyng614iuea9ij8gdctfe` (`ticket_number`),
  KEY `FKabm8uypnb91in1snytrhpsij1` (`approved_by_user_id`),
  KEY `FKkq299s6x3jbxk2moimwuq8dga` (`created_by_user_id`),
  KEY `FK3ibwtndt8d7xhh957spe5hvi6` (`customer_id`),
  KEY `FK3du821tc08kacfmfhufm4cveb` (`household_id`),
  KEY `FK29c4ox8empmy3bwojk7bnx9r7` (`original_invoice_id`),
  KEY `FKdtjfkycqjccmakfj4xahgrf6p` (`original_order_id`),
  CONSTRAINT `FK29c4ox8empmy3bwojk7bnx9r7` FOREIGN KEY (`original_invoice_id`) REFERENCES `e_invoices` (`id`),
  CONSTRAINT `FK3du821tc08kacfmfhufm4cveb` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FK3ibwtndt8d7xhh957spe5hvi6` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FKabm8uypnb91in1snytrhpsij1` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdtjfkycqjccmakfj4xahgrf6p` FOREIGN KEY (`original_order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKkq299s6x3jbxk2moimwuq8dga` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `screen_guide_steps`;
CREATE TABLE `screen_guide_steps` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `button_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `step_number` int NOT NULL,
  `target_element_selector` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `guide_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sgs_guide_step` (`guide_id`,`step_number`),
  KEY `idx_sgs_guide_step` (`guide_id`,`step_number`),
  CONSTRAINT `FKdie7o3d39bryrjoo5vy9f3qch` FOREIGN KEY (`guide_id`) REFERENCES `screen_guides` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `screen_guide_view_logs`;
CREATE TABLE `screen_guide_view_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `completed` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `duration_seconds` int DEFAULT NULL,
  `screen_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sgvl_screen_created` (`screen_code`,`created_at`),
  KEY `idx_sgvl_household` (`household_id`,`created_at`),
  KEY `idx_sgvl_completed` (`completed`),
  KEY `FKrd50o2a4yncqc7pphbhb263rt` (`user_id`),
  CONSTRAINT `FKg7dl3aja8o4uq4wl33yg5b1ht` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKrd50o2a4yncqc7pphbhb263rt` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `screen_guides`;
CREATE TABLE `screen_guides` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `screen_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `screen_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `view_count` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sg_screen_code` (`screen_code`),
  KEY `idx_sg_view_count` (`view_count`),
  KEY `idx_sg_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `service_packages`;
CREATE TABLE `service_packages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `data_retention_days` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` bit(1) NOT NULL,
  `max_invoices_per_month` int NOT NULL,
  `max_pos_points` int NOT NULL,
  `max_users` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf2ska0045picviynclv29ycdw` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shift_handovers`;
CREATE TABLE `shift_handovers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actual_cash` decimal(15,2) NOT NULL,
  `cash_revenue` decimal(15,2) NOT NULL,
  `completed_orders_count` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `difference_amount` decimal(15,2) NOT NULL,
  `difference_reason` text COLLATE utf8mb4_unicode_ci,
  `expected_cash` decimal(15,2) NOT NULL,
  `handover_time` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `opening_cash` decimal(15,2) NOT NULL,
  `pending_orders_count` int NOT NULL,
  `stage_number` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sh_shift` (`shift_id`),
  KEY `idx_sh_household` (`household_id`),
  KEY `idx_sh_sender` (`sender_user_id`),
  KEY `idx_sh_receiver` (`receiver_user_id`),
  KEY `idx_sh_handover_time` (`handover_time`),
  CONSTRAINT `FK7a5xn8kfcol6prge63o6p3th` FOREIGN KEY (`receiver_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKc76pqp3d0fkb8bf12yi7k46vs` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKe607v1uvh0f0tyo3kog19esg7` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKidgqb9o5oq39o0sbpvqtbuc6b` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opened_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  `opening_cash` decimal(15,2) NOT NULL DEFAULT '0.00',
  `closing_cash_expected` decimal(15,2) DEFAULT NULL,
  `closing_cash_actual` decimal(15,2) DEFAULT NULL,
  `difference_amount` decimal(15,2) DEFAULT NULL,
  `difference_reason` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `point_of_sale_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `household_id` (`household_id`),
  KEY `idx_shifts_user_status` (`user_id`,`status`),
  KEY `FKsbn8674popeacdchwkyf54m0p` (`point_of_sale_id`),
  CONSTRAINT `FKsbn8674popeacdchwkyf54m0p` FOREIGN KEY (`point_of_sale_id`) REFERENCES `points_of_sale` (`id`),
  CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shifts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_shift_opening_cash` CHECK ((`opening_cash` >= 0.00)),
  CONSTRAINT `chk_shift_status` CHECK ((`status` in (_utf8mb4'OPEN',_utf8mb4'CLOSED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `supplier_debts`;
CREATE TABLE `supplier_debts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `due_date` datetime(6) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `payment_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remaining_amount` decimal(15,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `goods_receipt_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdh7mj3mgf9eeaj1884f64dd3m` (`created_by_user_id`),
  KEY `FK2n47v3d1ql04t2mwufxgcg8g8` (`goods_receipt_id`),
  KEY `FKnq9y80tfe49iaq3ldj20q5jlt` (`household_id`),
  KEY `FK2oj4ehx3gcvd6b560mhgjyp98` (`supplier_id`),
  CONSTRAINT `FK2n47v3d1ql04t2mwufxgcg8g8` FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts` (`id`),
  CONSTRAINT `FK2oj4ehx3gcvd6b560mhgjyp98` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `FKdh7mj3mgf9eeaj1884f64dd3m` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKnq9y80tfe49iaq3ldj20q5jlt` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `supplier_return_items`;
CREATE TABLE `supplier_return_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_purchase_price` decimal(15,2) NOT NULL,
  `base_quantity` decimal(12,3) NOT NULL,
  `conversion_factor` decimal(12,3) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `item_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `unit_conversion_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_detail_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_return_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmo5n682iqwaajftm0s8r8ovtq` (`product_id`),
  KEY `FKqqvg2810yev5j9gk0g2oukqm` (`receipt_detail_id`),
  KEY `FKbpwnt2q1sphohsc2lwmikcu05` (`supplier_return_id`),
  CONSTRAINT `FKbpwnt2q1sphohsc2lwmikcu05` FOREIGN KEY (`supplier_return_id`) REFERENCES `supplier_returns` (`id`),
  CONSTRAINT `FKmo5n682iqwaajftm0s8r8ovtq` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKqqvg2810yev5j9gk0g2oukqm` FOREIGN KEY (`receipt_detail_id`) REFERENCES `goods_receipt_details` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `supplier_returns`;
CREATE TABLE `supplier_returns` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `reason` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `return_date` datetime(6) NOT NULL,
  `return_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhytam79s664d0j0yy3nfvrer9` (`return_number`),
  KEY `FKyrymnit6j9bm2845v9frn6vf` (`created_by_user_id`),
  KEY `FKco5af2xh0ace843a9d45p0hd7` (`household_id`),
  KEY `FK8nx3wkpyb399sgjff6mfyglgr` (`receipt_id`),
  KEY `FK3dpk4v5gqa9vbgo70e8xhbqii` (`supplier_id`),
  CONSTRAINT `FK3dpk4v5gqa9vbgo70e8xhbqii` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `FK8nx3wkpyb399sgjff6mfyglgr` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts` (`id`),
  CONSTRAINT `FKco5af2xh0ace843a9d45p0hd7` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKyrymnit6j9bm2845v9frn6vf` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_debt` decimal(15,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1jd2341hpjxclhdaugjqbj6qg` (`household_id`),
  CONSTRAINT `FK1jd2341hpjxclhdaugjqbj6qg` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `support_channels`;
CREATE TABLE `support_channels` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_type` enum('EMAIL','HOTLINE','PORTAL','WORKING_HOURS','ZALO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL,
  `is_active` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sc_is_active` (`is_active`),
  KEY `idx_sc_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sync_session_details`;
CREATE TABLE `sync_session_details` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sync_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sync_detail_session` (`sync_session_id`),
  KEY `idx_sync_detail_order_number` (`order_number`),
  CONSTRAINT `FKgfttuhaekvsdb3v3548gh5nyt` FOREIGN KEY (`sync_session_id`) REFERENCES `sync_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sync_sessions`;
CREATE TABLE `sync_sessions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `device_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `synced_at` datetime(6) NOT NULL,
  `total_conflicted` int NOT NULL,
  `total_duplicated` int NOT NULL,
  `total_failed` int NOT NULL,
  `total_received` int NOT NULL,
  `total_sent` int NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKaldlg0wv3yx0w4ba8msnps65o` (`session_code`),
  KEY `FKfeiwvs1b9ebd3srwimd7b82xo` (`user_id`),
  KEY `idx_sync_session_household_synced` (`household_id`,`synced_at` DESC),
  KEY `idx_sync_session_household_user_status` (`household_id`,`user_id`,`status`),
  CONSTRAINT `FKfeiwvs1b9ebd3srwimd7b82xo` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp4tlq3pgfe251t9378e4jfipj` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tax_connection_logs`;
CREATE TABLE `tax_connection_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `last_successful_response_at` datetime(6) DEFAULT NULL,
  `pending_queue_count` int NOT NULL,
  `response_time_ms` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfnwr45567pxjj823bc2kcnv0v` (`household_id`),
  CONSTRAINT `FKfnwr45567pxjj823bc2kcnv0v` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tax_declaration_periods`;
CREATE TABLE `tax_declaration_periods` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `end_date` date NOT NULL,
  `locked_at` datetime(6) DEFAULT NULL,
  `period_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_number` int NOT NULL,
  `period_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_revenue` decimal(15,2) NOT NULL,
  `total_tax_amount` decimal(15,2) NOT NULL,
  `total_valid_invoices` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `year` int NOT NULL,
  `created_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locked_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `declaration_exported` bit(1) NOT NULL,
  `declaration_exported_at` datetime(6) DEFAULT NULL,
  `total_purchase_amount` decimal(15,2) NOT NULL,
  `total_purchase_receipts` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_household_tax_period` (`household_id`,`period_type`,`year`,`period_number`),
  KEY `FKhpxxb30crw1bdqjuu373pgq8i` (`created_by_user_id`),
  KEY `FKo1aki8wa35psnyfcq5jga746a` (`locked_by_user_id`),
  CONSTRAINT `FKg8y8g4ln4pnogbsh27trp15wj` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`),
  CONSTRAINT `FKhpxxb30crw1bdqjuu373pgq8i` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKo1aki8wa35psnyfcq5jga746a` FOREIGN KEY (`locked_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tax_purchase_registers`;
CREATE TABLE `tax_purchase_registers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_purchase_price` decimal(15,2) NOT NULL,
  `base_quantity` decimal(12,3) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_supplier_missing` bit(1) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `product_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_date` datetime(6) NOT NULL,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `unit_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_detail_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbtjruaoni1usxu47ejnhim8d6` (`period_id`),
  KEY `FKp2xqpl123byita4631uf8io7h` (`product_id`),
  KEY `FKnbknwmrlhsuhwwjph0g9y55q1` (`receipt_id`),
  KEY `FKhre0cbpmim8pmvxa84awf061t` (`receipt_detail_id`),
  KEY `FK2pi9focfhfw7l5l7tljrq2pky` (`supplier_id`),
  CONSTRAINT `FK2pi9focfhfw7l5l7tljrq2pky` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `FKbtjruaoni1usxu47ejnhim8d6` FOREIGN KEY (`period_id`) REFERENCES `tax_declaration_periods` (`id`),
  CONSTRAINT `FKhre0cbpmim8pmvxa84awf061t` FOREIGN KEY (`receipt_detail_id`) REFERENCES `goods_receipt_details` (`id`),
  CONSTRAINT `FKnbknwmrlhsuhwwjph0g9y55q1` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts` (`id`),
  CONSTRAINT `FKp2xqpl123byita4631uf8io7h` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tax_rates`;
CREATE TABLE `tax_rates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `household_id` (`household_id`),
  CONSTRAINT `tax_rates_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_tax_rate_percentage` CHECK ((`rate_percentage` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tax_sales_registers`;
CREATE TABLE `tax_sales_registers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buyer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `invoice_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_pattern` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_symbol` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` datetime(6) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `revenue_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `tax_rate_percentage` decimal(5,2) NOT NULL,
  `invoice_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKll40e2e19grtkgb5wij939jip` (`invoice_id`),
  KEY `FKs5rm5eqfq0gfdf5phfdmicyu1` (`period_id`),
  CONSTRAINT `FKll40e2e19grtkgb5wij939jip` FOREIGN KEY (`invoice_id`) REFERENCES `e_invoices` (`id`),
  CONSTRAINT `FKs5rm5eqfq0gfdf5phfdmicyu1` FOREIGN KEY (`period_id`) REFERENCES `tax_declaration_periods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_display_settings`;
CREATE TABLE `user_display_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `button_size_level` enum('EXTRA_LARGE','LARGE','STANDARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `font_size_level` enum('EXTRA_LARGE','LARGE','STANDARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `high_contrast_enabled` bit(1) NOT NULL,
  `require_confirmation_dialog` bit(1) NOT NULL,
  `show_text_labels` bit(1) NOT NULL,
  `simple_mode_enabled` bit(1) NOT NULL,
  `simplified_pos_layout` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_uds_user_id` (`user_id`),
  CONSTRAINT `FKrmij3jro53qbem2qtns33bevr` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_notification_settings`;
CREATE TABLE `user_notification_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_enabled` bit(1) NOT NULL,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_notif_type` (`user_id`,`notification_type`),
  KEY `idx_uns_user` (`user_id`),
  CONSTRAINT `FKs9tjvxu8ko31ivjlq9l9duh9y` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `device_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_revoked` bit(1) NOT NULL,
  `last_active_at` datetime(6) NOT NULL,
  `login_at` datetime(6) NOT NULL,
  `revoke_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_by_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_household_id` (`household_id`),
  KEY `idx_user_sessions_active` (`household_id`,`is_revoked`,`last_active_at`),
  KEY `FKpg4bslujpcfmd48mtk7bmsi2y` (`revoked_by_user_id`),
  CONSTRAINT `FK8klxsgb8dcjjklmqebqp1twd5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKpg4bslujpcfmd48mtk7bmsi2y` FOREIGN KEY (`revoked_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKpguxt0im63dlaybrphpbskblv` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `household_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `point_of_sale_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `must_change_password` bit(1) NOT NULL,
  `password_changed_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_username` (`username`),
  KEY `household_id` (`household_id`),
  KEY `role_id` (`role_id`),
  KEY `FKbwii6txa5ow83ebcyjcp9lkw9` (`point_of_sale_id`),
  KEY `idx_users_phone_number` (`phone_number`),
  KEY `idx_users_email` (`email`),
  CONSTRAINT `FKbwii6txa5ow83ebcyjcp9lkw9` FOREIGN KEY (`point_of_sale_id`) REFERENCES `points_of_sale` (`id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- PHẦN 2: DỮ LIỆU NỀN TẢNG (MASTER & SEED DATA)
-- Khớp hoàn toàn phân quyền, danh mục, mẫu hóa đơn, cẩm nang, tài khoản demo
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 2.1. Danh mục vai trò người dùng (Roles VT-01 đến VT-06)
-- -------------------------------------------------------------------------------------
INSERT INTO `roles` (`id`, `code`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'VT-01', 'Chủ hộ kinh doanh', 'Người đứng tên hộ kinh doanh, quản lý toàn bộ hoạt động bán hàng và hóa đơn của cửa hàng.', NOW(), NOW()),
(2, 'VT-02', 'Nhân viên bán hàng', 'Người trực tiếp bán hàng và tính tiền tại điểm bán.', NOW(), NOW()),
(3, 'VT-03', 'Kế toán', 'Người phụ trách tra cứu, điều chỉnh hóa đơn và lập báo cáo, thường là kế toán thuê ngoài.', NOW(), NOW()),
(4, 'VT-04', 'Quản trị nền tảng', 'Người vận hành nền tảng phần mềm cung cấp dịch vụ cho nhiều hộ kinh doanh.', NOW(), NOW()),
(5, 'VT-05', 'Cơ quan thuế mô phỏng', 'Thành phần mô phỏng vai trò cơ quan thuế tiếp nhận và cấp mã hóa đơn trong phạm vi đồ án.', NOW(), NOW()),
(6, 'VT-06', 'Khách hàng', 'Người mua hàng nhận hóa đơn điện tử từ cửa hàng.', NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.2. Gói cước dịch vụ nền tảng (Service Packages)
-- -------------------------------------------------------------------------------------
INSERT INTO `service_packages` (`id`, `code`, `name`, `price`, `description`, `max_pos_points`, `max_users`, `max_invoices_per_month`, `data_retention_days`, `is_active`, `created_at`, `updated_at`) VALUES
('pkg-001', 'BASIC', 'Gói Cơ Bản (Starter)', 99000.00, 'Dành cho hộ kinh doanh nhỏ, tối đa 3 tài khoản và 300 hóa đơn/tháng', 1, 3, 300, 180, 1, NOW(), NOW()),
('pkg-002', 'STANDARD', 'Gói Tiêu Chuẩn (Standard)', 499000.00, 'Dành cho hộ kinh doanh vừa, tối đa 10 tài khoản và 1.000 hóa đơn/tháng', 3, 10, 1000, 365, 1, NOW(), NOW()),
('pkg-003', 'PREMIUM', 'Gói Nâng Cao (Premium)', 999000.00, 'Dành cho chuỗi cửa hàng, tối đa 50 tài khoản và 5.000 hóa đơn/tháng', 10, 50, 5000, 730, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.3. Hộ kinh doanh mẫu (Default Business Household)
-- -------------------------------------------------------------------------------------
INSERT INTO `business_households` (`id`, `name`, `tax_code`, `phone_number`, `address`, `representative_name`, `revenue_threshold_enabled`, `rounding_rule`, `offline_max_hours`, `offline_max_orders`, `session_timeout_minutes`, `status`, `created_at`, `updated_at`) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tạp Hóa Bán Hàng Việt (Cửa hàng mẫu)', '0123456789', '0901234567', '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Nguyễn Văn A', 1, 'HALF_UP', 72, 1000, 60, 'ACTIVE', NOW(), NOW());

-- Cài đặt cấu hình hộ kinh doanh
INSERT INTO `business_household_settings` (`id`, `household_id`, `auto_retry_enabled`, `max_retry_attempts`, `retry_interval_minutes`, `max_retry_hours_deadline`, `bank_transfer_timeout_minutes`, `expense_approval_threshold`, `max_order_holding_hours`, `revenue_warning_threshold_percentage`, `tax_period_type`, `tax_reminder_days_before`, `tax_reminder_enabled`, `shift_difference_threshold`, `debt_reminder_days_before`, `is_onboarding_completed`, `is_onboarding_skipped`, `max_offline_sync_hours`, `return_days_limit`, `created_at`, `updated_at`) VALUES
('4edbf978-7c97-4260-8236-b4c3a5d2eb70', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 3, 15, 24, 15, 500000.00, 4, 80.00, 'MONTHLY', 3, 1, 50000.00, 3, 1, 0, 72, 7, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.4. Danh sách Điểm bán / Chi nhánh (Points of Sale) & Bàn ăn (Dining Tables)
-- -------------------------------------------------------------------------------------
INSERT INTO `points_of_sale` (`id`, `household_id`, `pos_code`, `name`, `phone_number`, `address`, `is_active`, `is_default`, `invoice_symbol`, `created_at`, `updated_at`) VALUES
('bfa331e4-14dd-4708-8071-5a6aca59db57', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'POS-01', 'Chi nhánh Trung tâm (Quầy 1)', '0901234567', '123 Đường Lê Lợi, Quận 1, TP. HCM', 1, 1, '1C26TAA', NOW(), NOW()),
('5708ab97-37de-41c3-92b6-292aac138b92', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'POS-02', 'Chi nhánh 2 (Quầy 2)', '0901234568', '456 Đường Nguyễn Huệ, Quận 1, TP. HCM', 1, 0, '1C26TAA', NOW(), NOW()),
('59eb910e-6498-49aa-adf6-ae254d9f43b8', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'POS-03', 'Kho tổng và giao hàng', '0901234569', '789 Đường Điện Biên Phủ, Bình Thạnh, TP. HCM', 1, 0, '1C26TAA', NOW(), NOW());

INSERT INTO `dining_tables` (`id`, `household_id`, `name`, `area`, `seat_capacity`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
('7668aaea-dee0-4291-a390-bcf9cce3da75', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bàn 01', 'Tầng trệt', 4, 1, 1, NOW(), NOW()),
('1ad95a7c-1090-4762-af92-997e5eccd804', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bàn 02', 'Tầng trệt', 4, 2, 1, NOW(), NOW()),
('5ffd8d66-3a2a-46af-bfda-8f1ecb6a1ecf', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bàn 03', 'Tầng lầu', 6, 3, 1, NOW(), NOW()),
('9a12bc34-dee0-4291-a390-bcf9cce3da88', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mang về', 'Quầy thu ngân', 0, 4, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.5. Tài khoản người dùng mẫu cho toàn bộ các vai trò (Users)
-- Mật khẩu mặc định cho toàn bộ tài khoản demo: 123456
-- -------------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `household_id`, `role_id`, `point_of_sale_id`, `username`, `password_hash`, `full_name`, `phone_number`, `email`, `is_active`, `must_change_password`, `created_at`, `updated_at`) VALUES
-- VT-01: Chủ hộ kinh doanh
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'chuho_viet', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Nguyễn Văn A (Chủ hộ)', '0901234567', 'chuho_viet@banhangviet.vn', 1, 0, NOW(), NOW()),
-- VT-02: Nhân viên bán hàng
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'nhanvien_viet', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Trần Thị B (Thu ngân)', '0907654321', 'nhanvien_viet@banhangviet.vn', 1, 0, NOW(), NOW()),
-- VT-03: Kế toán thuế
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, NULL, 'ketoan_viet', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Phạm Văn C (Kế toán)', '0911223344', 'ketoan_viet@banhangviet.vn', 1, 0, NOW(), NOW()),
-- VT-04: Quản trị nền tảng (Platform Admin)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', NULL, 4, NULL, 'quantri_viet', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Quản trị nền tảng Bán Hàng Việt', '0900000004', 'quantri_viet@banhangviet.vn', 1, 0, NOW(), NOW()),
-- VT-05: Cơ quan thuế mô phỏng
('77ed68ef-8584-11f1-8d23-a02942c0b5f1', NULL, 5, NULL, 'thue_viet', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Cổng tiếp nhận HĐĐT Cơ quan Thuế', '0900000005', 'thue_viet@gdt.gov.vn', 1, 0, NOW(), NOW());

-- Đăng ký gói cước cho hộ kinh doanh (gán bởi Platform Admin)
INSERT INTO `household_subscriptions` (`id`, `household_id`, `package_id`, `assigned_by_user_id`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
('sub-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pkg-003', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'ACTIVE', NOW(), NOW());

-- Cấu hình hiển thị giao diện cho chủ hộ (chế độ tiêu chuẩn và hỗ trợ)
INSERT INTO `user_display_settings` (`id`, `user_id`, `button_size_level`, `font_size_level`, `high_contrast_enabled`, `simple_mode_enabled`, `simplified_pos_layout`, `show_text_labels`, `require_confirmation_dialog`, `created_at`, `updated_at`) VALUES
('uds-001', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STANDARD', 'STANDARD', 0, 0, 0, 1, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.6. Thuế suất (Tax Rates)
-- -------------------------------------------------------------------------------------
INSERT INTO `tax_rates` (`id`, `household_id`, `name`, `rate_percentage`, `is_active`, `created_at`, `updated_at`) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thuế doanh thu phân phối hàng hóa (1%)', 1.00, 1, NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thuế doanh thu dịch vụ (5%)', 5.00, 1, NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thuế doanh thu sản xuất/gia công (3%)', 3.00, 1, NOW(), NOW()),
('dff7dd16-b5a7-11f1-8212-a02942c0b5f1', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thuế GTGT 0% (Không chịu thuế / Miễn thuế)', 0.00, 1, NOW(), NOW()),
('dff7ea29-b5a7-11f1-8212-a02942c0b5f1', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thuế GTGT 8% (Giảm theo Nghị quyết Quốc hội)', 8.00, 1, NOW(), NOW()),
('eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thuế GTGT 10% tiêu chuẩn', 10.00, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.7. Mẫu hóa đơn (Invoice Templates) & Dải số hóa đơn (Invoice Number Ranges)
-- -------------------------------------------------------------------------------------
INSERT INTO `invoice_templates` (`id`, `household_id`, `invoice_pattern`, `invoice_symbol`, `title`, `footer_note`, `created_at`, `updated_at`) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1', '1C26TAA', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 'Cảm ơn quý khách đã mua hàng tại Hộ kinh doanh Bán Hàng Việt! Hóa đơn điện tử có mã CQT khởi tạo từ máy tính tiền.', NOW(), NOW());

INSERT INTO `invoice_number_ranges` (`id`, `household_id`, `invoice_pattern`, `invoice_symbol`, `start_number`, `end_number`, `current_number`, `warning_threshold`, `status`, `created_at`, `updated_at`) VALUES
('36f01910-abfa-11f1-b6b4-04bf1b60e44a', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1', '1C26TAA', 1, 100000, 1, 50, 'ACTIVE', NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.8. Nhóm hàng hóa (Product Groups)
-- -------------------------------------------------------------------------------------
INSERT INTO `product_groups` (`id`, `household_id`, `name`, `created_at`, `updated_at`, `deleted_at`) VALUES
('grp-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Đồ uống & Giải khát', NOW(), NOW(), NULL),
('grp-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thực phẩm khô & Mì ăn liền', NOW(), NOW(), NULL),
('grp-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gia vị & Dầu ăn', NOW(), NOW(), NULL),
('grp-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sữa & Chế phẩm từ sữa', NOW(), NOW(), NULL),
('grp-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bánh kẹo & Đồ ăn vặt', NOW(), NOW(), NULL),
('grp-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rau củ & Nông sản tươi (Bán theo cân)', NOW(), NOW(), NULL),
('grp-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hóa mỹ phẩm & Tẩy rửa', NOW(), NOW(), NULL);

-- -------------------------------------------------------------------------------------
-- 2.9. Danh mục hàng hóa chuẩn đại diện các loại hình (Products)
-- Bao gồm: Hàng có barcode, Hàng bán theo cân, Hàng có quy đổi đơn vị, Hàng giá sỉ
-- -------------------------------------------------------------------------------------
INSERT INTO `products` (`id`, `household_id`, `group_id`, `tax_rate_id`, `sku`, `barcode`, `name`, `unit`, `cost_price`, `price`, `stock_quantity`, `initial_stock_quantity`, `min_stock_quantity`, `is_sold_by_weight`, `min_weight_step`, `decimal_places`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
-- 1. Nước ngọt Coca Cola 320ml (Có quy đổi Thùng, có bảng giá sỉ)
('prd-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-001', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-COCA-320', '8935049500543', 'Nước ngọt Coca Cola lon 320ml', 'Lon', 8000.00, 10000.00, 240.000, 240.000, 24.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 2. Bia Tiger lon 330ml
('prd-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-001', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-TIGER-330', '8934822212338', 'Bia Tiger lon 330ml', 'Lon', 14000.00, 18000.00, 180.000, 180.000, 24.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 3. Nước tinh khiết Aquafina 500ml
('prd-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-001', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-AQUA-500', '8934588012111', 'Nước khoáng tinh khiết Aquafina 500ml', 'Chai', 4000.00, 6000.00, 300.000, 300.000, 24.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 4. Mì ăn liền Hảo Hảo tôm chua cay (Có quy đổi Thùng 30 gói)
('prd-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-002', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-HAOHAO-TCC', '8934563138164', 'Mì Hảo Hảo Tôm Chua Cay 75g', 'Gói', 3600.00, 4500.00, 450.000, 450.000, 30.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 5. Dầu ăn Simply đậu nành 1L
('prd-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-003', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-SIMPLY-1L', '8934988010012', 'Dầu ăn Simply nguyên chất 1L', 'Chai', 48000.00, 58000.00, 80.000, 80.000, 10.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 6. Nước mắm Nam Ngư Đệ Nhị 900ml
('prd-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-003', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-NAMNGU-900', '8936017361205', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 'Chai', 25000.00, 32000.00, 100.000, 100.000, 12.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 7. Sữa tươi Vinamilk có đường 100% 1L
('prd-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-004', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-VNM-1L', '8934673111002', 'Sữa tươi tiệt trùng Vinamilk 1L', 'Hộp', 30000.00, 36000.00, 120.000, 120.000, 12.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 8. Bánh Chocopie Orion hộp 12 cái
('prd-008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-005', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-CHOCO-12', '8936036010016', 'Bánh Chocopie Orion hộp 12 cái 396g', 'Hộp', 42000.00, 52000.00, 60.000, 60.000, 10.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL),
-- 9. Gạo thơm ST25 Ông Cua (Bán theo cân kg - Decimal qty)
('prd-009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-006', 'dff7dd16-b5a7-11f1-8212-a02942c0b5f1', 'SKU-GAO-ST25', '8938501234001', 'Gạo thơm đặc sản ST25', 'Kg', 28000.00, 35000.00, 500.000, 500.000, 50.000, 1, 0.500, 2, 'ACTIVE', NOW(), NOW(), NULL),
-- 10. Thịt heo ba chỉ tươi (Bán theo cân kg - Decimal qty)
('prd-010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-006', 'dff7dd16-b5a7-11f1-8212-a02942c0b5f1', 'SKU-THIT-HEO', '8938501234002', 'Thịt heo ba chỉ tươi ngon', 'Kg', 110000.00, 140000.00, 85.500, 85.500, 10.000, 1, 0.100, 3, 'ACTIVE', NOW(), NOW(), NULL),
-- 11. Nước rửa chén Sunlight Chanh 750g
('prd-011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grp-007', 'eaf2898f-3dfc-4fea-abb3-7ed38a876029', 'SKU-SUNLIGHT-750', '8934868124015', 'Nước rửa chén Sunlight Thiên Nhiên 750g', 'Chai', 24000.00, 30000.00, 90.000, 90.000, 12.000, 0, 1.000, 0, 'ACTIVE', NOW(), NOW(), NULL);

-- Tồn kho phân bổ chi tiết theo Điểm bán & Kho tổng (pos_inventories)
-- Gồm: Kho tổng gốc POS-03 lưu trữ số lượng lớn, Quầy 1 POS-01 và Quầy 2 POS-02 nhận điều chuyển từ kho gốc
INSERT INTO `pos_inventories` (`id`, `household_id`, `point_of_sale_id`, `product_id`, `stock_quantity`, `min_stock_quantity`, `created_at`, `updated_at`) VALUES
-- 1. Kho tổng và giao hàng (POS-03: 59eb910e-6498-49aa-adf6-ae254d9f43b8) - Kho gốc lưu trữ dự trữ
('pos-inv-p03-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-001', 144.000, 24.000, NOW(), NOW()),
('pos-inv-p03-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-002', 108.000, 24.000, NOW(), NOW()),
('pos-inv-p03-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-003', 180.000, 24.000, NOW(), NOW()),
('pos-inv-p03-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-004', 270.000, 30.000, NOW(), NOW()),
('pos-inv-p03-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-005',  48.000, 10.000, NOW(), NOW()),
('pos-inv-p03-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-006',  60.000, 12.000, NOW(), NOW()),
('pos-inv-p03-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-007',  70.000, 12.000, NOW(), NOW()),
('pos-inv-p03-008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-008',  36.000, 10.000, NOW(), NOW()),
('pos-inv-p03-009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-009', 300.000, 50.000, NOW(), NOW()),
('pos-inv-p03-010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-010',  45.000, 10.000, NOW(), NOW()),
('pos-inv-p03-011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'prd-011',  54.000, 12.000, NOW(), NOW()),

-- 2. Chi nhánh Trung tâm Quầy 1 (POS-01: bfa331e4-14dd-4708-8071-5a6aca59db57)
('pos-inv-p01-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-001',  60.000, 12.000, NOW(), NOW()),
('pos-inv-p01-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-002',  48.000, 12.000, NOW(), NOW()),
('pos-inv-p01-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-003',  80.000, 12.000, NOW(), NOW()),
('pos-inv-p01-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-004', 120.000, 15.000, NOW(), NOW()),
('pos-inv-p01-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-005',  20.000,  5.000, NOW(), NOW()),
('pos-inv-p01-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-006',  25.000,  6.000, NOW(), NOW()),
('pos-inv-p01-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-007',  32.000,  6.000, NOW(), NOW()),
('pos-inv-p01-008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-008',  16.000,  5.000, NOW(), NOW()),
('pos-inv-p01-009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-009', 140.000, 20.000, NOW(), NOW()),
('pos-inv-p01-010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-010',  25.500,  5.000, NOW(), NOW()),
('pos-inv-p01-011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'prd-011',  24.000,  6.000, NOW(), NOW()),

-- 3. Chi nhánh 2 Quầy 2 (POS-02: 5708ab97-37de-41c3-92b6-292aac138b92)
('pos-inv-p02-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-001',  36.000, 12.000, NOW(), NOW()),
('pos-inv-p02-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-002',  24.000, 12.000, NOW(), NOW()),
('pos-inv-p02-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-003',  40.000, 12.000, NOW(), NOW()),
('pos-inv-p02-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-004',  60.000, 15.000, NOW(), NOW()),
('pos-inv-p02-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-005',  12.000,  5.000, NOW(), NOW()),
('pos-inv-p02-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-006',  15.000,  6.000, NOW(), NOW()),
('pos-inv-p02-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-007',  18.000,  6.000, NOW(), NOW()),
('pos-inv-p02-008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-008',   8.000,  5.000, NOW(), NOW()),
('pos-inv-p02-009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-009',  60.000, 20.000, NOW(), NOW()),
('pos-inv-p02-010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-010',  15.000,  5.000, NOW(), NOW()),
('pos-inv-p02-011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5708ab97-37de-41c3-92b6-292aac138b92', 'prd-011',  12.000,  6.000, NOW(), NOW());

-- Quy đổi đơn vị tính (Unit Conversions): 1 Thùng Coca = 24 Lon; 1 Thùng Mì = 30 Gói
INSERT INTO `product_unit_conversions` (`id`, `product_id`, `unit_name`, `conversion_factor`, `price`, `barcode`, `is_default_sale`, `is_default_import`, `created_at`, `updated_at`) VALUES
('uc-001', 'prd-001', 'Thùng', 24.000, 230000.00, '8935049500999', 0, 1, NOW(), NOW()),
('uc-002', 'prd-004', 'Thùng', 30.000, 130000.00, '8934563138999', 0, 1, NOW(), NOW());

-- Bảng giá bậc thang (Price Tiers): Coca Cola mua sỉ từ 10 lon giá 9.200 đ, từ 24 lon (1 thùng) giá 9.000 đ
INSERT INTO `product_price_tiers` (`id`, `household_id`, `product_id`, `unit_conversion_id`, `tier_name`, `min_quantity`, `max_quantity`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
('tier-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'prd-001', NULL, 'Giá sỉ cấp 1 (Từ 10 lon)', 10.000, 23.000, 9200.00, 1, NOW(), NOW()),
('tier-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'prd-001', NULL, 'Giá sỉ cấp 2 (Từ 24 lon)', 24.000, NULL, 9000.00, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.10. Khách hàng thân thiết & Công nợ (Customers)
-- -------------------------------------------------------------------------------------
INSERT INTO `customers` (`id`, `household_id`, `name`, `phone_number`, `tax_code`, `email`, `address`, `credit_limit`, `current_debt`, `loyalty_points`, `is_vip`, `discount_rate`, `discount_type`, `total_spent`, `default_delivery_channel`, `reminder_days_before`, `reminder_days_after`, `created_at`, `updated_at`, `deleted_at`) VALUES
('cust-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Khách Lẻ Mua Tại Quầy', '0900000001', NULL, NULL, 'Tại quầy', 0.00, 0.00, 0, 0, 0.00, 'PERCENT', 0.00, 'QR', 3, 3, NOW(), NOW(), NULL),
('cust-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Anh Hoàng (Khách Quen Mua Nợ)', '0912345678', NULL, 'hoang.nguyen@gmail.com', 'Số 45 Lê Lợi, Quận 1', 5000000.00, 1250000.00, 150, 0, 0.00, 'PERCENT', 4500000.00, 'ZALO', 3, 3, NOW(), NOW(), NULL),
('cust-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chị Lan (Khách VIP Chiết Khấu)', '0987654322', '0312456789', 'lan.tran@lanfashion.vn', 'Số 88 Hai Bà Trưng, Quận 1', 10000000.00, 0.00, 850, 1, 5.00, 'PERCENT', 18500000.00, 'EMAIL', 3, 3, NOW(), NOW(), NULL);

-- Cấu hình chương trình tích điểm khách hàng thân thiết
INSERT INTO `loyalty_program_configs` (`id`, `household_id`, `is_enabled`, `spend_amount_per_point`, `point_value`, `min_points_to_redeem`, `max_redeem_rate_per_order`, `point_expiry_days`, `created_at`, `updated_at`) VALUES
('9b34f0c4-8ab3-4e0c-91cd-e2c0aadacc33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 10000.00, 1000.00, 50, 100.00, 365, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.11. Nhà cung cấp & Công nợ nhập hàng (Suppliers)
-- -------------------------------------------------------------------------------------
INSERT INTO `suppliers` (`id`, `household_id`, `name`, `phone_number`, `tax_code`, `email`, `address`, `note`, `status`, `current_debt`, `created_at`, `updated_at`, `deleted_at`) VALUES
('sup-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Công Ty Cổ Phần Nước Giải Khát Quốc Tế', '02838222333', '0301234567', 'sales@beverages.vn', 'KCN Tân Bình, Tân Phú, TP. HCM', 'Nhà cung cấp chính Coca Cola, Nước khoáng', 'ACTIVE', 3500000.00, NOW(), NOW(), NULL),
('sup-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Đại Lý Phân Phối Bánh Kẹo & Thực Phẩm Tiến Phát', '02839444555', '0307654321', 'tienphat.dist@gmail.com', 'Chợ đầu mối Bình Điền, Quận 8, TP. HCM', 'Giao hàng sáng sớm thứ Hai và thứ Năm', 'ACTIVE', 0.00, NOW(), NOW(), NULL);

-- -------------------------------------------------------------------------------------
-- 2.12. Hạng mục thu chi tiền mặt ngoài bán hàng (Cash Transaction Categories)
-- -------------------------------------------------------------------------------------
INSERT INTO `cash_transaction_categories` (`id`, `household_id`, `name`, `type`, `description`, `is_active`, `is_system_default`, `created_at`, `updated_at`, `deleted_at`) VALUES
('cat-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thu tiền nợ khách hàng', 'INCOME', 'Khách trả nợ các đơn mua chịu trước đây', 1, 1, NOW(), NOW(), NULL),
('cat-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thu nhập khác ngoài bán hàng', 'INCOME', 'Thu thanh lý bao bì carton, vỏ chai', 1, 1, NOW(), NOW(), NULL),
('cat-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chi trả tiền hàng cho Nhà cung cấp', 'EXPENSE', 'Thanh toán tiền mặt cho đơn nhập hàng', 1, 1, NOW(), NOW(), NULL),
('cat-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chi điện nước & Mạng Internet', 'EXPENSE', 'Hóa đơn dịch vụ vận hành cửa hàng hàng tháng', 1, 1, NOW(), NOW(), NULL),
('cat-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chi tiêu vặt & Nước uống nhân viên', 'EXPENSE', 'Chi ăn trưa, túi xốp, văn phòng phẩm', 1, 1, NOW(), NOW(), NULL);

-- -------------------------------------------------------------------------------------
-- 2.13. Kênh hỗ trợ kỹ thuật (Support Channels)
-- -------------------------------------------------------------------------------------
INSERT INTO `support_channels` (`id`, `channel_name`, `channel_type`, `contact_value`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
('cfe13233-b275-11f1-98ba-a02942c0b5f1', 'Tổng đài hỗ trợ kỹ thuật', 'HOTLINE', '1900 6868', 'Miễn phí cước gọi, tiếp nhận 07:30 - 22:00', 1, 1, NOW(), NOW()),
('cfe14822-b275-11f1-98ba-a02942c0b5f1', 'Zalo hỗ trợ kỹ thuật 24/7', 'ZALO', '0988 123 456', 'Tiếp nhận hình ảnh lỗi và giải đáp tức thì', 2, 1, NOW(), NOW()),
('cfe149c7-b275-11f1-98ba-a02942c0b5f1', 'Hộp thư điện tử hỗ trợ', 'EMAIL', 'hotro@banhangviet.vn', 'Phản hồi chi tiết trong vòng 15 phút', 3, 1, NOW(), NOW()),
('cfe14a63-b275-11f1-98ba-a02942c0b5f1', 'Giờ làm việc bộ phận hỗ trợ', 'WORKING_HOURS', '07:30 - 22:00 (Thứ Hai - Chủ Nhật)', 'Hỗ trợ liên tục tất cả các ngày trong tuần, kể cả ngày lễ', 4, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.14. Câu hỏi thường gặp nghiệp vụ (FAQ Items - 14 câu hỏi chuẩn khớp Entity JPA)
-- -------------------------------------------------------------------------------------
INSERT INTO `faq_items` (`id`, `category`, `question`, `answer`, `action_url`, `action_label`, `keywords`, `display_order`, `view_count`, `is_active`, `created_at`, `updated_at`) VALUES
('faq-001', 'INVOICE', 'Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?', 'Mở màn hình Quản lý hóa đơn điện tử, lọc trạng thái "Gửi lỗi" hoặc "Đang xử lý". Bạn có thể nhấn nút "Gửi lại thuế" để hệ thống tự động truyền lại dữ liệu. Nếu Cơ quan thuế từ chối do sai sót thông tin, hãy xem cột chi tiết lý do để chỉnh sửa.', '/invoices?status=FAILED', 'Kiểm tra hóa đơn lỗi', 'hóa đơn treo, loi hoa don, thue tu choi, gui thue loi', 1, 24, 1, NOW(), NOW()),
('faq-002', 'INVOICE', 'Làm thế nào để sửa hoặc điều chỉnh hóa đơn đã cấp mã bị sai sót?', 'Với hóa đơn đã được Cơ quan thuế cấp mã nhưng phát hiện sai sót, bạn vào danh sách Hóa đơn, chọn hóa đơn và nhấn "Lập hóa đơn điều chỉnh" hoặc "Lập hóa đơn thay thế" theo quy định của Thông tư 78.', '/invoices', 'Xem danh sách hóa đơn', 'sua hoa don, dieu chinh hoa don, hoa don sai, thong tu 78', 2, 18, 1, NOW(), NOW()),
('faq-003', 'INVOICE', 'Dải số hóa đơn bị hết số thì cần làm gì để tiếp tục xuất đơn?', 'Khi dải số hóa đơn đã dùng hết, bạn cần vào mục Cài đặt -> Mẫu hóa đơn để khai báo dải số hóa đơn mới theo ký hiệu mẫu số đã đăng ký thông báo phát hành với Cơ quan thuế.', '/settings/invoice-template', 'Khai báo dải số mới', 'het so hoa don, dai so hoa don, ky hieu mau so', 3, 15, 1, NOW(), NOW()),
('faq-004', 'INVOICE', 'Hóa đơn khởi tạo từ máy tính tiền POS được truyền lên thuế khi nào?', 'Theo quy định, hóa đơn khởi tạo từ máy tính tiền tại quầy POS sẽ tự động ký số và truyền dữ liệu lên hệ thống Cơ quan Thuế ngay khi kết ca hoặc vào cuối ngày kinh doanh.', '/invoices', 'Kiểm tra trạng thái HĐĐT', 'may tinh tien, truyen thue, hoa don pos, cuoi ngay', 4, 11, 1, NOW(), NOW()),
('faq-005', 'SALES', 'Đơn hàng bán xong chưa kịp xuất hóa đơn thì tìm lại ở đâu?', 'Bạn vào màn hình Danh sách đơn hàng tại quầy POS, sử dụng bộ lọc "Chưa xuất hóa đơn" để tra cứu đơn cần phát hành bổ sung. Bấm trực tiếp vào đơn và nhấn nút "Phát hành hóa đơn gửi Thuế".', '/orders', 'Danh sách đơn hàng', 'tim don hang, don chua xuat hoa don, pos ban hang', 1, 22, 1, NOW(), NOW()),
('faq-006', 'SALES', 'Cách xử lý khi khách hàng trả lại hàng đã mua?', 'Để xử lý đổi trả hàng, bạn vào mục Bán hàng -> Trả hàng, gõ mã hóa đơn cũ hoặc quét mã vạch sản phẩm. Hệ thống sẽ tự động tính số tiền hoàn trả cho khách và cộng bù lại số lượng tồn kho.', '/return-tickets', 'Lập phiếu trả hàng', 'tra hang, doi tra, phieu tra hang, hoan tien', 2, 19, 1, NOW(), NOW()),
('faq-007', 'SALES', 'Làm sao để bán hàng tươi sống theo cân ký (thịt, rau củ) tại POS?', 'Trong danh mục Hàng hóa, khi khai báo mặt hàng hãy tích chọn ô "Bán theo trọng lượng". Khi thanh toán tại POS, cân điện tử sẽ tự truyền số kg vào giỏ hoặc thu ngân có thể gõ trực tiếp số lẻ (ví dụ: 0.35 kg).', '/products', 'Cài đặt hàng theo cân', 'ban theo can, can dien tu, thit rau cu, trong luong', 3, 16, 1, NOW(), NOW()),
('faq-008', 'SALES', 'Bị mất mạng Internet có tiếp tục bán hàng tại quầy thu ngân được không?', 'Có thể bán bình thường. Hệ thống tích hợp chế độ Offline tự động lưu đơn vào bộ nhớ máy tính quầy. Khi có mạng trở lại, toàn bộ đơn hàng sẽ tự động đồng bộ lên máy chủ đám mây.', '/pos', 'Mở quầy thu ngân POS', 'mat mang, offline, mat ket noi internet, ban hang offline', 4, 14, 1, NOW(), NOW()),
('faq-009', 'ACCOUNT', 'Quên mật khẩu đăng nhập hoặc muốn đổi mật khẩu thì làm sao?', 'Nếu đang đăng nhập, hãy vào Thông tin cá nhân rồi chọn "Đổi mật khẩu". Nếu quên mật khẩu, hãy nhấn "Quên mật khẩu" ngoài màn hình đăng nhập để nhận mã OTP qua Email hoặc Số điện thoại.', '/settings/user-profile', 'Đổi mật khẩu ngay', 'quen mat khau, doi mat khau, reset mat khau, otp', 1, 30, 1, NOW(), NOW()),
('faq-010', 'ACCOUNT', 'Tài khoản nhân viên thu ngân bị khóa thì mở khóa ở đâu?', 'Chỉ chủ hộ kinh doanh mới có quyền mở khóa tài khoản nhân viên. Chủ hộ vào mục Nhân viên -> Quản lý nhân viên, tìm nhân viên đang bị khóa và bấm nút "Mở khóa tài khoản".', '/employees', 'Quản lý nhân viên', 'khoa tai khoan, mo khoa nhan vien, thu ngan bi khoa', 2, 12, 1, NOW(), NOW()),
('faq-011', 'ACCOUNT', 'Phân quyền cho thu ngân chỉ được tính tiền, không được xem báo cáo doanh thu?', 'Hệ thống hỗ trợ phân quyền vai trò chuyên biệt: Vai trò VT-02 (Thu ngân): Chỉ truy cập màn hình POS bán hàng và mở/đóng ca. Vai trò VT-01 (Chủ hộ): Xem toàn bộ doanh thu và sổ sách báo cáo thuế.', '/employees', 'Phân quyền tài khoản', 'phan quyen, an doanh thu, quyen thu ngan, vai tro vt-02', 3, 9, 1, NOW(), NOW()),
('faq-012', 'DATA', 'Dữ liệu của tôi được sao lưu như thế nào và làm sao kiểm tra an toàn?', 'Hệ thống tự động sao lưu dữ liệu toàn bộ cửa hàng hàng ngày vào lúc 02:30 sáng lên đám mây mã hóa. Bạn có thể vào mục Cài đặt -> Sao lưu & Khôi phục để xem lịch sử và kết quả chạy thử phục hồi định kỳ.', '/settings/backup-export', 'Xem lịch sử sao lưu', 'sao luu du lieu, backup, an toan du lieu, phuc hoi', 1, 17, 1, NOW(), NOW()),
('faq-013', 'DATA', 'Cách kiểm tra và đối soát công nợ khách hàng định kỳ?', 'Vào phân hệ Khách hàng -> Tab Đối chiếu nợ, chọn khoảng thời gian cần chốt và tên khách hàng để xem chi tiết các phát sinh mua nợ, số tiền đã trả và số dư nợ còn lại. Bấm nút "In biên bản" để chốt nợ.', '/customers', 'Đối soát công nợ', 'doi soat cong no, cong no khach hang, so no, cong no', 2, 14, 1, NOW(), NOW()),
('faq-014', 'DATA', 'Làm sao để xuất file Excel danh sách hàng hóa và giá vốn?', 'Tại màn hình Quản lý hàng hóa, nhìn sang góc trên bên phải thanh công cụ và bấm nút "Xuất file". Hệ thống sẽ tạo ngay file bảng tính Excel đầy đủ mã SKU, tên hàng, đơn vị tính, tồn kho và giá bán.', '/products', 'Danh mục hàng hóa', 'xuat excel, tai file hang hoa, bao cao ton kho, export excel', 3, 11, 1, NOW(), NOW());

-- -------------------------------------------------------------------------------------
-- 2.15. Cẩm nang hướng dẫn sử dụng tương tác tại chỗ (Screen Guides & Steps)
-- Đầy đủ 10 màn hình chuẩn bám sát NCL-19-CN-003
-- -------------------------------------------------------------------------------------
INSERT INTO `screen_guides` (`id`, `screen_code`, `screen_name`, `description`, `action_url`, `target_role`, `view_count`, `is_active`, `created_at`, `updated_at`) VALUES
('guide-01-inv-cfg', 'SCREEN_INVOICE_CONFIG', 'Cấu hình mẫu và ký hiệu hóa đơn điện tử', 'Khai báo ký hiệu hóa đơn theo chuẩn Cơ quan Thuế để đủ điều kiện phát hành hóa đơn', '/settings/invoice-template', 'VT-01', 0, 1, NOW(), NOW()),
('guide-02-pos-chk', 'SCREEN_POS_CHECKOUT', 'Màn hình thu ngân & Bán hàng POS', 'Các bước chọn hàng, sửa số lượng và thanh toán tiền cho khách tại quầy', '/pos', 'ALL', 0, 1, NOW(), NOW()),
('guide-03-inv-crt', 'SCREEN_E_INVOICE_CREATE', 'Phát hành hóa đơn điện tử gửi Thuế', 'Tạo hóa đơn điện tử từ đơn hàng hoàn tất và gửi cấp mã cơ quan thuế', '/invoices/create', 'VT-01', 0, 1, NOW(), NOW()),
('guide-04-prod-mgmt', 'SCREEN_PRODUCT_MANAGEMENT', 'Quản lý danh mục hàng hóa', 'Thêm mới mặt hàng, cài đặt giá bán và số lượng tồn kho ban đầu', '/products', 'ALL', 0, 1, NOW(), NOW()),
('guide-05-cust-debt', 'SCREEN_CUSTOMER_DEBT', 'Sổ nợ & Đối chiếu công nợ khách hàng', 'Theo dõi số tiền khách mua nợ, lập biên bản đối chiếu và in giấy xác nhận nợ', '/debts', 'VT-01', 0, 1, NOW(), NOW()),
('guide-06-goods-rcpt', 'SCREEN_GOODS_RECEIPT', 'Nhập kho hàng hóa từ nhà cung cấp', 'Tạo phiếu nhập kho để cập nhật số lượng tồn kho và theo dõi giá vốn hàng mua', '/inventory/receipts', 'ALL', 0, 1, NOW(), NOW()),
('guide-07-tax-period', 'SCREEN_TAX_PERIOD', 'Sổ sách & Kỳ kê khai thuế', 'Tổng hợp doanh thu bán ra, bảng kê mua vào và kiểm tra số liệu chuẩn bị nộp thuế', '/tax-periods', 'VT-01', 0, 1, NOW(), NOW()),
('guide-08-dashboard', 'SCREEN_DASHBOARD', 'Tổng quan hoạt động kinh doanh', 'Nắm bắt nhanh doanh thu trong ngày, số đơn hoàn thành và các cảnh báo quan trọng', '/dashboard', 'ALL', 0, 1, NOW(), NOW()),
('guide-09-reports-rev', 'SCREEN_REPORTS_REVENUE', 'Báo cáo doanh thu & Mặt hàng bán chạy', 'Xem thống kê tổng tiền bán hàng, lợi nhuận ước tính và top sản phẩm được khách chuộng nhất', '/reports', 'ALL', 0, 1, NOW(), NOW()),
('guide-10-annual-rev', 'SCREEN_ANNUAL_REVENUE', 'Theo dõi doanh thu lũy kế năm & Ngưỡng thuế', 'Giám sát tổng doanh thu tích lũy trong năm và khoảng cách tới ngưỡng 1 tỷ đồng theo quy định Thuế', '/reports/annual-revenue', 'VT-01', 0, 1, NOW(), NOW());

INSERT INTO `screen_guide_steps` (`id`, `guide_id`, `step_number`, `title`, `content`, `target_element_selector`, `button_label`, `image_url`, `created_at`, `updated_at`) VALUES
-- Guide 01: Cấu hình hóa đơn
('step-01-inv-01', 'guide-01-inv-cfg', 1, 'Mở màn hình Cấu hình hóa đơn', 'Bấm vào biểu tượng Bánh răng (Cài đặt) ở góc trên bên phải, sau đó chọn mục Mẫu hóa đơn.', '#menu-settings-invoice', 'Cấu hình hóa đơn', '/images/guides/invoice_cfg_step1.png', NOW(), NOW()),
('step-01-inv-02', 'guide-01-inv-cfg', 2, 'Chọn loại hóa đơn kinh doanh', 'Chọn loại Hóa đơn giá trị gia tăng (mẫu 1) hoặc Hóa đơn bán hàng (mẫu 2) phù hợp với phương pháp tính thuế của bạn.', '#select-invoice-pattern', 'Chọn loại hóa đơn', '/images/guides/invoice_cfg_step2.png', NOW(), NOW()),
('step-01-inv-03', 'guide-01-inv-cfg', 3, 'Nhập ký hiệu hóa đơn', 'Điền ký hiệu hóa đơn gồm 7 ký tự theo thông báo của Thuế (ví dụ: 1C26TAA). Chữ số đầu là mẫu số, C là có mã CQT, 26 là năm 2026.', '#input-invoice-symbol', 'Nhập ký hiệu', '/images/guides/invoice_cfg_step3.png', NOW(), NOW()),
('step-01-inv-04', 'guide-01-inv-cfg', 4, 'Bấm nút Lưu ký hiệu để hoàn tất', 'Kiểm tra lại ký hiệu vừa nhập rồi bấm nút Lưu màu xanh lá cây ở góc dưới màn hình để hoàn thành khai báo.', '#btn-save-invoice-template', 'Lưu ký hiệu', '/images/guides/invoice_cfg_step4.png', NOW(), NOW()),
-- Guide 02: Bán hàng POS
('step-02-pos-01', 'guide-02-pos-chk', 1, 'Tìm hoặc quét mã vạch sản phẩm', 'Dùng máy quét mã vạch vào bao bì sản phẩm hoặc gõ tên mặt hàng vào ô Tìm kiếm hàng hóa ở phía trên màn hình.', '#pos-search-input', 'Tìm hàng hóa', '/images/guides/pos_step1.png', NOW(), NOW()),
('step-02-pos-02', 'guide-02-pos-chk', 2, 'Chọn mặt hàng và điều chỉnh số lượng', 'Bấm vào mặt hàng hiển thị để đưa vào giỏ. Bấm nút dấu cộng (+) hoặc trừ (-) trên dòng để tăng giảm số lượng mua.', '#pos-cart-table', 'Thêm vào giỏ', '/images/guides/pos_step2.png', NOW(), NOW()),
('step-02-pos-03', 'guide-02-pos-chk', 3, 'Bấm nút Thanh toán màu xanh to', 'Nhìn sang góc dưới bên phải màn hình giỏ hàng và bấm nút Thanh toán có hiện tổng số tiền khách cần trả.', '#btn-pos-checkout', 'Thanh toán', '/images/guides/pos_step3.png', NOW(), NOW()),
('step-02-pos-04', 'guide-02-pos-chk', 4, 'Nhập tiền khách đưa và Hoàn tất', 'Chọn hình thức Tiền mặt hoặc Chuyển khoản QR. Nhập số tiền khách đưa và bấm Hoàn tất để in hóa đơn trả khách.', '#btn-pos-complete', 'Hoàn tất đơn', '/images/guides/pos_step4.png', NOW(), NOW()),
-- Guide 03: Phát hành HĐĐT
('step-03-inv-01', 'guide-03-inv-crt', 1, 'Chọn đơn hàng cần xuất hóa đơn', 'Chọn đơn hàng đã thanh toán thành công trong danh sách đơn để tạo hóa đơn nháp.', '#invoice-order-select', 'Chọn đơn hàng', '/images/guides/inv_crt_step1.png', NOW(), NOW()),
('step-03-inv-02', 'guide-03-inv-crt', 2, 'Kiểm tra thông tin người mua', 'Nhập tên khách hàng, mã số thuế hoặc địa chỉ nếu khách yêu cầu xuất hóa đơn công ty.', '#invoice-buyer-info', 'Thông tin người mua', '/images/guides/inv_crt_step2.png', NOW(), NOW()),
('step-03-inv-03', 'guide-03-inv-crt', 3, 'Bấm nút Gửi Cơ quan Thuế cấp mã', 'Bấm nút Gửi CQT màu xanh đậm ở góc phải để hệ thống truyền dữ liệu hóa đơn lên hệ thống Thuế.', '#btn-submit-to-tax', 'Gửi cơ quan thuế', '/images/guides/inv_crt_step3.png', NOW(), NOW()),
('step-03-inv-04', 'guide-03-inv-crt', 4, 'Nhận kết quả và giao hóa đơn cho khách', 'Khi trạng thái chuyển sang Đã cấp mã, bạn có thể bấm In hóa đơn hoặc Gửi mã QR tra cứu cho khách xem trên điện thoại.', '#btn-print-invoice', 'In / Gửi khách', '/images/guides/inv_crt_step4.png', NOW(), NOW()),
-- Guide 04: Quản lý hàng hóa
('step-04-prod-01', 'guide-04-prod-mgmt', 1, 'Bấm nút Thêm mặt hàng mới', 'Tại danh sách hàng hóa, bấm nút Thêm hàng màu xanh ở phía trên góc phải màn hình.', '#btn-add-product', 'Thêm hàng mới', '/images/guides/prod_step1.png', NOW(), NOW()),
('step-04-prod-02', 'guide-04-prod-mgmt', 2, 'Điền tên hàng và giá bán', 'Gõ tên hàng hóa dễ nhớ, đơn vị tính (gói, lon, cái, kg) và giá tiền bạn muốn bán cho khách.', '#product-form-fields', 'Điền thông tin', '/images/guides/prod_step2.png', NOW(), NOW()),
('step-04-prod-03', 'guide-04-prod-mgmt', 3, 'Bấm nút Lưu hàng hóa', 'Bấm nút Lưu ở dưới cùng biểu mẫu để đưa sản phẩm lên quầy bán hàng POS ngay lập tức.', '#btn-save-product', 'Lưu mặt hàng', '/images/guides/prod_step3.png', NOW(), NOW()),
-- Guide 05: Công nợ
('step-05-debt-01', 'guide-05-cust-debt', 1, 'Chọn khách hàng cần xem nợ', 'Gõ tên hoặc số điện thoại khách hàng quen vào ô tìm kiếm để mở trang sổ nợ của khách đó.', '#debt-customer-search', 'Chọn khách nợ', '/images/guides/debt_step1.png', NOW(), NOW()),
('step-05-debt-02', 'guide-05-cust-debt', 2, 'Xem các đơn hàng chưa trả tiền', 'Kiểm tra danh sách các ngày mua nợ, số tiền từng đơn và tổng nợ hiện tại của khách.', '#debt-ledger-table', 'Xem chi tiết nợ', '/images/guides/debt_step2.png', NOW(), NOW()),
('step-05-debt-03', 'guide-05-cust-debt', 3, 'Bấm nút Lập đối chiếu công nợ', 'Chọn khoảng thời gian (ví dụ từ đầu tháng đến nay) và bấm nút Lập đối chiếu nợ để chốt số liệu.', '#btn-create-reconciliation', 'Lập đối chiếu nợ', '/images/guides/debt_step3.png', NOW(), NOW()),
('step-05-debt-04', 'guide-05-cust-debt', 4, 'Bấm In giấy xác nhận nợ gửi khách', 'Bấm nút In biên bản để gửi giấy xác nhận nợ có ghi rõ chi tiết từng đơn hàng cho khách ký tên.', '#btn-print-reconciliation', 'In giấy chốt nợ', '/images/guides/debt_step4.png', NOW(), NOW()),
-- Guide 06: Nhập kho
('step-06-rcpt-01', 'guide-06-goods-rcpt', 1, 'Bấm nút Tạo phiếu nhập kho', 'Bấm nút màu xanh Lập phiếu nhập ở góc trên bên phải trang Quản lý kho.', '#btn-create-receipt', 'Lập phiếu nhập', '/images/guides/rcpt_step1.png', NOW(), NOW()),
('step-06-rcpt-02', 'guide-06-goods-rcpt', 2, 'Chọn nhà cung cấp và mặt hàng nhập', 'Gõ tên nhà cung cấp giao hàng, sau đó quét mã vạch hoặc chọn các mặt hàng vừa nhận vào phiếu.', '#receipt-item-selector', 'Thêm hàng nhập', '/images/guides/rcpt_step2.png', NOW(), NOW()),
('step-06-rcpt-03', 'guide-06-goods-rcpt', 3, 'Nhập số lượng, đơn giá và Bấm Lưu', 'Điền số lượng thực nhận và giá nhập từ bên giao hàng, sau đó bấm nút Lưu phiếu nhập kho để cộng tồn hàng.', '#btn-save-receipt', 'Lưu phiếu nhập', '/images/guides/rcpt_step3.png', NOW(), NOW()),
-- Guide 07: Kê khai thuế
('step-07-tax-01', 'guide-07-tax-period', 1, 'Chọn kỳ tính thuế Tháng hoặc Quý', 'Chọn đúng kỳ bạn cần nộp thuế (ví dụ Quý 3 năm 2026) để hệ thống tự động gom dữ liệu bán hàng.', '#tax-period-selector', 'Chọn kỳ thuế', '/images/guides/tax_step1.png', NOW(), NOW()),
('step-07-tax-02', 'guide-07-tax-period', 2, 'Kiểm tra bảng tổng hợp doanh thu', 'Xem lại tổng tiền bán ra, tiền thuế từng nhóm ngành hàng để đảm bảo khớp với thực tế.', '#tax-summary-view', 'Kiểm tra doanh thu', '/images/guides/tax_step2.png', NOW(), NOW()),
('step-07-tax-03', 'guide-07-tax-period', 3, 'Bấm Lập bảng kê mua vào', 'Bấm nút Lập bảng kê mua vào để rà soát chi phí hàng hóa mua trong kỳ phục vụ thanh tra thuế.', '#btn-gen-purchase-reg', 'Lập bảng kê mua vào', '/images/guides/tax_step3.png', NOW(), NOW()),
('step-07-tax-04', 'guide-07-tax-period', 4, 'Bấm Xuất tờ khai thuế', 'Bấm nút Tải tờ khai thuế 01/CNKD hoặc xuất file Excel để gửi cho kế toán hoặc nộp lên Cổng thuế.', '#btn-export-tax-form', 'Xuất tờ khai', '/images/guides/tax_step4.png', NOW(), NOW()),
-- Guide 08: Dashboard
('step-08-dash-01', 'guide-08-dashboard', 1, 'Theo dõi doanh thu & Đơn hàng', 'Quan sát các thẻ chỉ số trên cùng để biết doanh thu thuần hôm nay, số đơn đã bán và tiền mặt thực tế.', '#dashboard-stats-cards', 'Số liệu tổng quan', '/images/guides/dash_step1.png', NOW(), NOW()),
('step-08-dash-02', 'guide-08-dashboard', 2, 'Xem biểu đồ tăng trưởng', 'Biểu đồ cột thể hiện biến động doanh thu theo từng ngày trong tuần hoặc tháng để bạn so sánh hiệu quả.', '#dashboard-revenue-chart', 'Biểu đồ', '/images/guides/dash_step2.png', NOW(), NOW()),
('step-08-dash-03', 'guide-08-dashboard', 3, 'Xử lý việc khẩn cấp & Tồn kho', 'Kiểm tra danh sách hàng sắp hết và các cảnh báo hóa đơn lỗi hoặc nợ quá hạn để xử lý kịp thời.', '#dashboard-alerts-section', 'Cảnh báo khẩn', '/images/guides/dash_step3.png', NOW(), NOW()),
-- Guide 09: Báo cáo
('step-09-rev-01', 'guide-09-reports-rev', 1, 'Chọn mốc thời gian cần xem', 'Ở cột bên trái, bấm chọn nhanh Hôm nay, 7 ngày qua, Tháng này hoặc chọn khoảng ngày cụ thể bạn muốn theo dõi.', '#report-date-filter', 'Chọn khoảng thời gian', '/images/guides/rev_step1.png', NOW(), NOW()),
('step-09-rev-02', 'guide-09-reports-rev', 2, 'Đọc số liệu Doanh thu thuần & Đơn', 'Nhìn lên 2 ô phía trên để biết tổng số tiền thu được sau khi trừ khuyến mãi/trả hàng và tổng số đơn đã phục vụ.', '#report-summary-cards', 'Tổng doanh thu', '/images/guides/rev_step2.png', NOW(), NOW()),
('step-09-rev-03', 'guide-09-reports-rev', 3, 'Xem biểu đồ ngày & Top hàng bán chạy', 'Kéo xuống để xem các ngày bán được nhiều tiền nhất và danh sách mặt hàng bán chạy để kịp thời nhập thêm hàng.', '#report-chart-section', 'Mặt hàng bán chạy', '/images/guides/rev_step3.png', NOW(), NOW()),
-- Guide 10: Doanh thu năm & Ngưỡng thuế
('step-10-ann-01', 'guide-10-annual-rev', 1, 'Xem tổng doanh thu lũy kế từ đầu năm', 'Hệ thống tự động cộng dồn doanh thu hợp lệ từ ngày 01/01 đến thời điểm hiện tại của cả hộ kinh doanh.', '#annual-accumulated-card', 'Doanh thu lũy kế', '/images/guides/ann_step1.png', NOW(), NOW()),
('step-10-ann-02', 'guide-10-annual-rev', 2, 'Kiểm tra mức độ an toàn so với ngưỡng 1 tỷ', 'Thanh tiến độ thể hiện phần trăm doanh thu đã đạt. Khi đạt trên 80% (800 triệu), hệ thống sẽ bật cảnh báo sớm.', '#annual-threshold-progress', 'Thanh tiến độ', '/images/guides/ann_step2.png', NOW(), NOW()),
('step-10-ann-03', 'guide-10-annual-rev', 3, 'Xem dự báo & Khuyến nghị kế toán', 'Đọc phần dự báo xu hướng để biết thời điểm có thể chạm ngưỡng, giúp chủ hộ chuẩn bị hóa đơn đầu vào đầy đủ.', '#annual-projection-card', 'Dự báo & Khuyến nghị', '/images/guides/ann_step3.png', NOW(), NOW());




-- =====================================================================================
-- PHẦN 3: DỮ LIỆU CÁC HỘ KINH DOANH PHỤ (TEST ROLE QUẢN TRỊ VT-04 & THUẾ VT-05)
-- Phục vụ kiểm thử Platform Admin xem danh sách hộ, khóa/mở khóa hộ, thống kê toàn sàn
-- và Cơ quan Thuế tra cứu, kiểm tra hóa đơn gửi từ nhiều MST khác nhau
-- Mọi tài khoản đều có mật khẩu mặc định: 123456
-- =====================================================================================

-- 3.1. Hộ kinh doanh bổ sung
INSERT INTO `business_households` (`id`, `name`, `tax_code`, `phone_number`, `address`, `representative_name`, `revenue_threshold_enabled`, `rounding_rule`, `offline_max_hours`, `offline_max_orders`, `session_timeout_minutes`, `status`, `created_at`, `updated_at`) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Quán Ăn Hương Việt', '0318991122', '0933112233', '56 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh', 'Lê Thị Hương', 1, 'HALF_UP', 72, 1000, 60, 'ACTIVE', NOW(), NOW()),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Cửa Hàng Tiện Lợi An Khang', '0319882233', '0944112233', '88 Đường Xô Viết Nghệ Tĩnh, Phường 25, Bình Thạnh, TP. Hồ Chí Minh', 'Trần Văn Khang', 1, 'HALF_UP', 72, 1000, 60, 'LOCKED', NOW(), NOW()),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Siêu Thị Mini Miền Tây', '0317773344', '0955112233', '234 Đường Nguyễn Thị Thập, Tân Phú, Quận 7, TP. Hồ Chí Minh', 'Phan Quốc Hùng', 1, 'HALF_UP', 72, 1000, 60, 'ACTIVE', NOW(), NOW());

-- Cấu hình cài đặt cho 3 hộ kinh doanh bổ sung
INSERT INTO `business_household_settings` (`id`, `household_id`, `auto_retry_enabled`, `max_retry_attempts`, `retry_interval_minutes`, `max_retry_hours_deadline`, `bank_transfer_timeout_minutes`, `expense_approval_threshold`, `max_order_holding_hours`, `revenue_warning_threshold_percentage`, `tax_period_type`, `tax_reminder_days_before`, `tax_reminder_enabled`, `shift_difference_threshold`, `debt_reminder_days_before`, `is_onboarding_completed`, `is_onboarding_skipped`, `max_offline_sync_hours`, `return_days_limit`, `created_at`, `updated_at`) VALUES
('set-huongviet-001', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 1, 3, 15, 24, 15, 500000.00, 4, 80.00, 'QUARTERLY', 3, 1, 50000.00, 3, 1, 0, 72, 7, NOW(), NOW()),
('set-ankhang-002',   'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 1, 3, 15, 24, 15, 500000.00, 4, 80.00, 'MONTHLY',   3, 1, 50000.00, 3, 1, 0, 72, 7, NOW(), NOW()),
('set-mientay-003',   'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 1, 3, 15, 24, 15, 500000.00, 4, 80.00, 'MONTHLY',   3, 1, 50000.00, 3, 1, 0, 72, 7, NOW(), NOW());

-- Đăng ký gói cước dịch vụ cho 3 hộ kinh doanh
INSERT INTO `household_subscriptions` (`id`, `household_id`, `package_id`, `assigned_by_user_id`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
('sub-huongviet-01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'pkg-002', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'ACTIVE', NOW(), NOW()),
('sub-ankhang-02',   'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'pkg-001', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH), 'EXPIRED', NOW(), NOW()),
('sub-mientay-03',   'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'pkg-003', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'ACTIVE', NOW(), NOW());

-- Điểm bán của các hộ kinh doanh phụ
INSERT INTO `points_of_sale` (`id`, `household_id`, `pos_code`, `name`, `phone_number`, `address`, `is_active`, `is_default`, `invoice_symbol`, `created_at`, `updated_at`) VALUES
('pos-hv-01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'POS-01', 'Quán Hương Việt - Quầy Thu Ngân', '0933112233', '56 Nguyễn Trãi, Quận 1, TP. HCM', 1, 1, '1C26THV', NOW(), NOW()),
('pos-ak-01', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'POS-01', 'Tiện Lợi An Khang - Quầy 1', '0944112233', '88 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. HCM', 1, 1, '1C26TAK', NOW(), NOW()),
('pos-mt-01', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'POS-01', 'Siêu Thị Miền Tây - Quầy Thu Ngân 1', '0955112233', '234 Nguyễn Thị Thập, Quận 7, TP. HCM', 1, 1, '1C26TMT', NOW(), NOW());

-- Tài khoản chủ hộ cho 3 hộ kinh doanh phụ (pass: 123456)
INSERT INTO `users` (`id`, `household_id`, `role_id`, `point_of_sale_id`, `username`, `password_hash`, `full_name`, `phone_number`, `email`, `is_active`, `must_change_password`, `created_at`, `updated_at`) VALUES
('usr-hv-owner', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 1, 'pos-hv-01', 'chuho_huongviet', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Lê Thị Hương (Chủ Quán Hương Việt)', '0933112233', 'huongviet@gmail.com', 1, 0, NOW(), NOW()),
('usr-ak-owner', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 1, 'pos-ak-01', 'chuho_ankhang',   '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Trần Văn Khang (Chủ Tiện Lợi An Khang)', '0944112233', 'ankhang@gmail.com', 0, 0, NOW(), NOW()),
('usr-mt-owner', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 1, 'pos-mt-01', 'chuho_mientay',   '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Phan Quốc Hùng (Chủ Siêu Thị Miền Tây)', '0955112233', 'mientaymart@gmail.com', 1, 0, NOW(), NOW());

-- Mẫu hóa đơn và dải số hóa đơn cho các hộ kinh doanh phụ
INSERT INTO `invoice_templates` (`id`, `household_id`, `invoice_pattern`, `invoice_symbol`, `title`, `footer_note`, `created_at`, `updated_at`) VALUES
('tmpl-hv-01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '1', '1C26THV', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 'Cảm ơn quý khách đã dùng bữa tại Quán Ăn Hương Việt!', NOW(), NOW()),
('tmpl-ak-01', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', '1', '1C26TAK', 'HÓA ĐƠN BÁN HÀNG', 'Cảm ơn quý khách đã mua sắm tại Tiện Lợi An Khang!', NOW(), NOW()),
('tmpl-mt-01', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', '1', '1C26TMT', 'HÓA ĐƠN BÁN HÀNG', 'Cảm ơn quý khách đã ghé thăm Siêu Thị Mini Miền Tây!', NOW(), NOW());

INSERT INTO `invoice_number_ranges` (`id`, `household_id`, `invoice_pattern`, `invoice_symbol`, `start_number`, `end_number`, `current_number`, `warning_threshold`, `status`, `created_at`, `updated_at`) VALUES
('range-hv-01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '1', '1C26THV', 1, 50000, 4, 50, 'ACTIVE', NOW(), NOW()),
('range-ak-01', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', '1', '1C26TAK', 1, 50000, 3, 50, 'ACTIVE', NOW(), NOW()),
('range-mt-01', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', '1', '1C26TMT', 1, 50000, 3, 50, 'ACTIVE', NOW(), NOW());

-- Hóa đơn điện tử của các hộ phụ gửi CQT (để test role Thuế thue_viet và Quản trị quantri_viet)
INSERT INTO `e_invoices` (`id`, `household_id`, `order_id`, `original_invoice_id`, `created_by_user_id`, `canceled_by_user_id`, `invoice_number`, `invoice_pattern`, `invoice_symbol`, `buyer_name`, `buyer_tax_code`, `buyer_address`, `buyer_phone`, `buyer_email`, `total_amount_before_tax`, `tax_amount`, `discount_amount`, `final_amount`, `status`, `tax_authority_code`, `tax_authority_response`, `cancel_reason`, `lookup_code`, `sent_to_tax_at`, `tax_response_at`, `canceled_at`, `created_at`, `updated_at`, `footer_note`, `title`, `retry_count`, `is_error_notified`, `payment_method`, `customer_delivery_status`, `point_discount_amount`, `points_redeemed`) VALUES
-- Quán ăn Hương Việt (MST 0318991122)
('inv-hv-001', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', NULL, NULL, 'usr-hv-owner', NULL, '00000001', '1', '1C26THV', 'Nguyễn Thị Mai', NULL, 'Quận 1, TP. HCM', '0912111222', 'mai.nguyen@gmail.com', 450000.00, 45000.00, 0.00, 495000.00, 'ISSUED', '26002345000000000901', 'Cấp mã thành công', NULL, 'HVTRA001', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'Cơm trưa văn phòng', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 0, 'CASH', 'DELIVERED', 0.00, 0),
('inv-hv-002', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', NULL, NULL, 'usr-hv-owner', NULL, '00000002', '1', '1C26THV', 'Công Ty TNHH Giải Pháp Công Nghệ Á Châu', '0315556677', 'Tòa nhà Bitexco, Q.1', '02838999888', 'ketoan@achau.com', 1250000.00, 125000.00, 0.00, 1375000.00, 'ISSUED', '26002345000000000902', 'Cấp mã thành công', NULL, 'HVTRA002', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'Tiệc tiếp khách công ty', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0),
('inv-hv-003', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', NULL, NULL, 'usr-hv-owner', NULL, '00000003', '1', '1C26THV', 'Đặng Tuấn Anh', NULL, 'Bình Thạnh, TP. HCM', '0938777888', 'tuananh@gmail.com', 680000.00, 68000.00, 0.00, 748000.00, 'ISSUED', '26002345000000000903', 'Cấp mã thành công', NULL, 'HVTRA003', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'Lẩu gà lá é và đồ uống', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 0, 'CASH', 'DELIVERED', 0.00, 0),
-- Tiện Lợi An Khang (MST 0319882233)
('inv-ak-001', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', NULL, NULL, 'usr-ak-owner', NULL, '00000001', '1', '1C26TAK', 'Khách vãng lai', NULL, 'Tại quầy', '0900000000', NULL, 185000.00, 0.00, 0.00, 185000.00, 'ISSUED', '26002345000000000911', 'Cấp mã thành công', NULL, 'AKTRA001', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 'Nhu yếu phẩm tiện lợi', 'HÓA ĐƠN BÁN HÀNG', 0, 0, 'CASH', 'DELIVERED', 0.00, 0),
('inv-ak-002', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', NULL, NULL, 'usr-ak-owner', NULL, '00000002', '1', '1C26TAK', 'Phạm Hồng Nhung', NULL, 'Bình Thạnh', '0919223344', 'nhungpham@gmail.com', 320000.00, 0.00, 0.00, 320000.00, 'ISSUED', '26002345000000000912', 'Cấp mã thành công', NULL, 'AKTRA002', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 'Bánh sữa thực phẩm', 'HÓA ĐƠN BÁN HÀNG', 0, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0),
-- Siêu Thị Mini Miền Tây (MST 0317773344)
('inv-mt-001', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', NULL, NULL, 'usr-mt-owner', NULL, '00000001', '1', '1C26TMT', 'Trần Thu Thảo', NULL, 'Quận 7, TP. HCM', '0977665544', 'thao.tran@gmail.com', 820000.00, 0.00, 0.00, 820000.00, 'ISSUED', '26002345000000000921', 'Cấp mã thành công', NULL, 'MTTRA001', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'Trái cây miền tây sầu riêng xoài', 'HÓA ĐƠN BÁN HÀNG', 0, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0),
('inv-mt-002', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', NULL, NULL, 'usr-mt-owner', NULL, '00000002', '1', '1C26TMT', 'Lâm Gia Huy', NULL, 'Quận 7', '0988223311', 'huy.lam@gmail.com', 540000.00, 0.00, 0.00, 540000.00, 'ISSUED', '26002345000000000922', 'Cấp mã thành công', NULL, 'MTTRA002', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'Gạo ST25 và nông sản sạch', 'HÓA ĐƠN BÁN HÀNG', 0, 0, 'CASH', 'DELIVERED', 0.00, 0);

-- Chi tiết mặt hàng trên hóa đơn của các hộ phụ
INSERT INTO `e_invoice_items` (`id`, `invoice_id`, `product_id`, `product_name`, `unit`, `quantity`, `unit_price`, `tax_rate_percentage`, `tax_amount`, `discount_amount`, `subtotal`, `created_at`) VALUES
('it-hv-101', 'inv-hv-001', NULL, 'Cơm Niêu Cá Kho Tộ', 'Phần', 2.000, 120000.00, 10.00, 24000.00, 0.00, 240000.00, NOW()),
('it-hv-102', 'inv-hv-001', NULL, 'Canh Chua Cá Lóc Đồng', 'Thố', 1.000, 150000.00, 10.00, 15000.00, 0.00, 150000.00, NOW()),
('it-hv-103', 'inv-hv-001', NULL, 'Trà Đá Đường Phèn', 'Ly', 3.000, 20000.00, 10.00, 6000.00, 0.00, 60000.00, NOW()),
('it-hv-201', 'inv-hv-002', NULL, 'Set Cơm Niêu Gia Đình 6 Người', 'Set', 1.000, 1250000.00, 10.00, 125000.00, 0.00, 1250000.00, NOW()),
('it-hv-301', 'inv-hv-003', NULL, 'Lẩu Gà Lá É Phú Yên Đặc Biệt', 'Nồi', 1.000, 480000.00, 10.00, 48000.00, 0.00, 480000.00, NOW()),
('it-hv-302', 'inv-hv-003', NULL, 'Gà Ta Nướng Muối Ớt Nửa Con', 'Đĩa', 1.000, 200000.00, 10.00, 20000.00, 0.00, 200000.00, NOW()),
('it-ak-101', 'inv-ak-001', NULL, 'Nước Ngọt Nước Suối Bánh Mì', 'Combo', 1.000, 185000.00, 0.00, 0.00, 0.00, 185000.00, NOW()),
('it-ak-201', 'inv-ak-002', NULL, 'Thực Phẩm Khô & Bánh Kẹo', 'Gói', 4.000, 80000.00, 0.00, 0.00, 0.00, 320000.00, NOW()),
('it-mt-101', 'inv-mt-001', NULL, 'Sầu Riêng Ri6 Chín Cây', 'Kg', 4.100, 200000.00, 0.00, 0.00, 0.00, 820000.00, NOW()),
('it-mt-201', 'inv-mt-002', NULL, 'Gạo Hạt Ngọc Trời ST25', 'Bao 10kg', 1.000, 360000.00, 0.00, 0.00, 0.00, 360000.00, NOW()),
('it-mt-202', 'inv-mt-002', NULL, 'Mãng Cầu Xiêm Miền Tây', 'Kg', 3.000, 60000.00, 0.00, 0.00, 0.00, 180000.00, NOW());


-- =====================================================================================
-- PHẦN 4: DỮ LIỆU HOẠT ĐỘNG THỰC TẾ CHI TIẾT CỦA CỬA HÀNG CHỦ HỘ VIỆT (chuho_viet)
-- Hộ kinh doanh: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (Tạp Hóa Bán Hàng Việt)
-- Đầy đủ: Nhân viên cơ sở, Ca kíp & Bàn giao, Đơn hàng, Hóa đơn điện tử CQT, Trả hàng,
-- Nhập kho, Trả NCC, Kiểm kê kho lệch tồn, Thu chi quỹ, Sổ nợ & Đối chiếu, Cảnh báo.
-- =====================================================================================

-- 4.1. Đội ngũ nhân viên cơ sở và các quầy làm việc (Pass mặc định: 123456)
-- Cửa hàng hộ kinh doanh không thuê thủ kho riêng; Chủ hộ tự quản lý xuất nhập kho tổng và phân bổ hàng
INSERT INTO `users` (`id`, `household_id`, `role_id`, `point_of_sale_id`, `username`, `password_hash`, `full_name`, `phone_number`, `email`, `is_active`, `must_change_password`, `created_at`, `updated_at`) VALUES
('usr-staff-chieu', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'nhanvien_chieu', '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Lê Văn Đạt (Thu ngân ca chiều Quầy 1)', '0907112233', 'dat.le@banhangviet.vn', 1, 0, NOW(), NOW()),
('usr-staff-pos2',  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, '5708ab97-37de-41c3-92b6-292aac138b92', 'nhanvien_pos2',  '$2a$10$QuMQI6R3H59eqJH9toH0TOhlyP9cqjJnUJlxvqxqq20S8KIDkhCMC', 'Nguyễn Hoàng Oanh (Thu ngân Quầy 2)',    '0907334455', 'oanh.nguyen@banhangviet.vn', 1, 0, NOW(), NOW());

-- 4.2. Ca làm việc (Shifts) & Biên bản bàn giao ca (Shift Handovers)
-- Ca hôm qua ca sáng: Thu ngân nhanvien_viet (07:00 - 15:00) tại POS-01
INSERT INTO `shifts` (`id`, `household_id`, `user_id`, `point_of_sale_id`, `opened_at`, `closed_at`, `opening_cash`, `closing_cash_expected`, `closing_cash_actual`, `difference_amount`, `difference_reason`, `status`, `created_at`, `updated_at`) VALUES
('shift-01-closed', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'bfa331e4-14dd-4708-8071-5a6aca59db57', DATE_SUB(NOW(), INTERVAL 28 HOUR), DATE_SUB(NOW(), INTERVAL 20 HOUR), 1000000.00, 3140000.00, 3140000.00, 0.00, 'Khớp hoàn toàn 100%', 'CLOSED', DATE_SUB(NOW(), INTERVAL 28 HOUR), DATE_SUB(NOW(), INTERVAL 20 HOUR)),
-- Ca hôm qua ca chiều: Thu ngân nhanvien_chieu (15:00 - 22:30) tại POS-01
('shift-02-closed', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'usr-staff-chieu', 'bfa331e4-14dd-4708-8071-5a6aca59db57', DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 13 HOUR), 3140000.00, 4850000.00, 4850000.00, 0.00, 'Khớp sổ sách kết ca', 'CLOSED', DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 13 HOUR)),
-- Ca hôm nay: Thu ngân nhanvien_viet mở từ sáng sớm tại POS-01 (ĐANG HOẠT ĐỘNG)
('shift-03-open',   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'bfa331e4-14dd-4708-8071-5a6aca59db57', DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL, 1500000.00, NULL, NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 4 HOUR), NOW()),
-- Ca hôm qua tại Quầy 2 (POS-02): Thu ngân nhanvien_pos2 (08:00 - 17:00)
('shift-pos2-01-closed', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'usr-staff-pos2', '5708ab97-37de-41c3-92b6-292aac138b92', DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 17 HOUR), 1000000.00, 1108000.00, 1108000.00, 0.00, 'Khớp sổ sách kết ca quầy 2', 'CLOSED', DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 17 HOUR)),
-- Ca hôm nay tại Quầy 2 (POS-02): Thu ngân nhanvien_pos2 mở sáng (ĐANG HOẠT ĐỘNG)
('shift-pos2-02-open',   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'usr-staff-pos2', '5708ab97-37de-41c3-92b6-292aac138b92', DATE_SUB(NOW(), INTERVAL 5 HOUR), NULL, 1000000.00, NULL, NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW());

-- Biên bản bàn giao ca giữa Ca sáng (nhanvien_viet) và Ca chiều (nhanvien_chieu)
INSERT INTO `shift_handovers` (`id`, `household_id`, `shift_id`, `sender_user_id`, `receiver_user_id`, `stage_number`, `opening_cash`, `cash_revenue`, `expected_cash`, `actual_cash`, `difference_amount`, `difference_reason`, `completed_orders_count`, `pending_orders_count`, `handover_time`, `notes`, `created_at`, `updated_at`) VALUES
('sh-handover-01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'usr-staff-chieu', 1, 1000000.00, 2140000.00, 3140000.00, 3140000.00, 0.00, 'Khớp hoàn toàn, tiền ngăn kéo nguyên vẹn', 5, 0, DATE_SUB(NOW(), INTERVAL 20 HOUR), 'Bàn giao ca thành công, giấy in hóa đơn còn đầy', DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 20 HOUR));

-- 4.3. Đơn hàng (Orders)
INSERT INTO `orders` (`id`, `household_id`, `shift_id`, `created_by_user_id`, `customer_id`, `order_number`, `order_label`, `point_of_sale_id`, `dining_table_id`, `total_amount`, `discount_amount`, `customer_discount_amount`, `promotion_discount_amount`, `point_discount_amount`, `tax_amount`, `final_amount`, `payment_method`, `payment_status`, `status`, `sync_status`, `is_offline`, `points_earned`, `points_redeemed`, `cancel_reason`, `cancel_reason_note`, `canceled_by_user_id`, `canceled_at`, `created_at`, `updated_at`) VALUES
-- Đơn 1: 7 ngày trước - Chị Lan mua sỉ
('ord-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-003', 'ORD-20260917-001', 'Đơn sỉ đại lý', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 1280000.00, 64000.00, 64000.00, 0.00, 0.00, 110545.45, 1216000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED', 'SYNCED', 0, 120, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
-- Đơn 2: 5 ngày trước - Khách lẻ mua bia và mồi
('ord-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260919-001', 'Khách mua tại quầy', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 360000.00, 0.00, 0.00, 0.00, 0.00, 32727.27, 360000.00, 'CASH', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- Đơn 3: 4 ngày trước - Anh Hoàng mua chịu (Ghi nợ sổ)
('ord-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-002', 'ORD-20260920-001', 'Mua chịu ghi nợ', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 1250000.00, 0.00, 0.00, 0.00, 0.00, 113636.36, 1250000.00, 'DEBT', 'DEBT', 'COMPLETED', 'SYNCED', 0, 125, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
-- Đơn 4: 3 ngày trước - Nhu yếu phẩm gia đình
('ord-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260921-001', 'Khách lẻ', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 480000.00, 0.00, 0.00, 0.00, 0.00, 43636.36, 480000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- Đơn 5: 2 ngày trước - Chị Lan mua hàng tiêu dùng VIP
('ord-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-003', 'ORD-20260922-001', 'Khách VIP', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 850000.00, 42500.00, 42500.00, 0.00, 0.00, 73409.09, 807500.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED', 'SYNCED', 0, 80, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Đơn 6: Hôm qua ca sáng - Khách mua nước ngọt và mì
('ord-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260923-001', 'Bán lẻ sáng', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 245000.00, 0.00, 0.00, 0.00, 0.00, 22272.73, 245000.00, 'CASH', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR)),
-- Đơn 7: Hôm qua ca sáng - Thanh toán kết hợp (COMBINED: Tiền mặt 500k + CK 895k)
('ord-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260923-002', 'Bán lẻ kết hợp', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 1395000.00, 0.00, 0.00, 0.00, 0.00, 126818.18, 1395000.00, 'COMBINED', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
-- Đơn 8: Hôm qua ca sáng - Đơn có 2 chai Nước mắm Nam Ngư (Sau đó làm phiếu trả hàng)
('ord-008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260923-003', 'Đơn có hàng trả', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 500000.00, 0.00, 0.00, 0.00, 0.00, 45454.55, 500000.00, 'CASH', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
-- Đơn 9: Hôm qua ca chiều - Cân thịt heo + gạo ST25
('ord-009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-02-closed', 'usr-staff-chieu', 'cust-001', 'ORD-20260923-004', 'Cân thực phẩm tươi', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 642000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 642000.00, 'CASH', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 16 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR)),
-- Đơn 10: Hôm qua ca chiều - ĐƠN BỊ HỦY DO KHÁCH ĐỔI Ý
('ord-010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-02-closed', 'usr-staff-chieu', 'cust-001', 'ORD-20260923-005', 'Đơn khách hủy', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 432000.00, 0.00, 0.00, 0.00, 0.00, 39272.73, 432000.00, 'CASH', 'PENDING', 'CANCELED', 'SYNCED', 0, 0, 0, 'CUSTOMER_CHANGED_MIND', 'Khách quên mang ví và không đem điện thoại để chuyển khoản', 'usr-staff-chieu', DATE_SUB(NOW(), INTERVAL 15 HOUR), DATE_SUB(NOW(), INTERVAL 15 HOUR), DATE_SUB(NOW(), INTERVAL 15 HOUR)),
-- Đơn 11: Sáng nay - Nước giải khát đầu ngày
('ord-011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-03-open', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260924-001', 'Khách mua sáng', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 140000.00, 0.00, 0.00, 0.00, 0.00, 12727.27, 140000.00, 'CASH', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
-- Đơn 12: Sáng nay - Gạo + Dầu ăn Simply (Chuyển khoản VietQR)
('ord-012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-03-open', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260924-002', 'Bán hàng sáng', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 466000.00, 0.00, 0.00, 0.00, 0.00, 10545.45, 466000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
-- Đơn 13: Sáng nay - ĐƠN TREO TẠI BÀN 02 (Đang ngồi uống nước, chưa thanh toán)
('ord-013', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-03-open', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260924-003', 'Đơn treo Bàn 02', 'bfa331e4-14dd-4708-8071-5a6aca59db57', '1ad95a7c-1090-4762-af92-997e5eccd804', 72000.00, 0.00, 0.00, 0.00, 0.00, 6545.45, 72000.00, 'CASH', 'PENDING', 'CREATING', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 45 MINUTE), NOW()),
-- Đơn 14: Sáng nay - Hóa đơn gửi thuế bị lỗi truyền nhận để test retry queue
('ord-014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-03-open', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'cust-001', 'ORD-20260924-004', 'Đơn thử lỗi thuế', 'bfa331e4-14dd-4708-8071-5a6aca59db57', NULL, 310000.00, 0.00, 0.00, 0.00, 0.00, 28181.82, 310000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
-- Đơn 15: Hôm qua tại Quầy 2 (POS-02) - Khách lẻ mua nước và bánh
('ord-pos2-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-pos2-01-closed', 'usr-staff-pos2', 'cust-001', 'ORD-20260923-P201', 'Bán lẻ Quầy 2', '5708ab97-37de-41c3-92b6-292aac138b92', NULL, 108000.00, 0.00, 0.00, 0.00, 0.00, 9818.18, 108000.00, 'CASH', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),
-- Đơn 16: Sáng nay tại Quầy 2 (POS-02) - Khách mua sữa và dầu ăn
('ord-pos2-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-pos2-02-open',   'usr-staff-pos2', 'cust-001', 'ORD-20260924-P202', 'Bán hàng Quầy 2', '5708ab97-37de-41c3-92b6-292aac138b92', NULL, 130000.00, 0.00, 0.00, 0.00, 0.00, 11818.18, 130000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED', 'SYNCED', 0, 0, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- 4.4. Chi tiết các mặt hàng trong đơn hàng (Order Items)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `cost_price`, `discount_amount`, `tax_rate_percentage`, `tax_amount`, `subtotal`, `rounding_difference`, `created_at`, `updated_at`) VALUES
-- ord-001: Chị Lan mua sỉ
('oi-001-1', 'ord-001', 'prd-001', 'Nước ngọt Coca Cola lon 320ml', 48.000, 9000.00, 8000.00, 24000.00, 10.00, 39272.73, 432000.00, 0.00, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('oi-001-2', 'ord-001', 'prd-002', 'Bia Tiger lon 330ml', 24.000, 18000.00, 14000.00, 20000.00, 10.00, 39272.73, 432000.00, 0.00, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('oi-001-3', 'ord-001', 'prd-004', 'Mì Hảo Hảo Tôm Chua Cay 75g', 90.000, 4622.22, 3600.00, 20000.00, 10.00, 32000.00, 416000.00, 0.00, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
-- ord-002: Bia Tiger
('oi-002-1', 'ord-002', 'prd-002', 'Bia Tiger lon 330ml', 20.000, 18000.00, 14000.00, 0.00, 10.00, 32727.27, 360000.00, 0.00, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- ord-003: Anh Hoàng mua chịu
('oi-003-1', 'ord-003', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 10.000, 58000.00, 48000.00, 0.00, 10.00, 52727.27, 580000.00, 0.00, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('oi-003-2', 'ord-003', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 10.000, 36000.00, 30000.00, 0.00, 10.00, 32727.27, 360000.00, 0.00, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('oi-003-3', 'ord-003', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 5.000, 52000.00, 42000.00, 0.00, 10.00, 23636.36, 260000.00, 0.00, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('oi-003-4', 'ord-003', 'prd-003', 'Nước khoáng tinh khiết Aquafina 500ml', 8.000, 6250.00, 4000.00, 0.00, 10.00, 4545.45, 50000.00, 0.00, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
-- ord-004:
('oi-004-1', 'ord-004', 'prd-006', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 5.000, 32000.00, 25000.00, 0.00, 10.00, 14545.45, 160000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('oi-004-2', 'ord-004', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 4.000, 58000.00, 48000.00, 0.00, 10.00, 21090.91, 232000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('oi-004-3', 'ord-004', 'prd-011', 'Nước rửa chén Sunlight Thiên Nhiên 750g', 2.000, 30000.00, 24000.00, 0.00, 10.00, 5454.55, 60000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('oi-004-4', 'ord-004', 'prd-003', 'Nước khoáng tinh khiết Aquafina 500ml', 4.000, 7000.00, 4000.00, 0.00, 10.00, 2545.45, 28000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- ord-005:
('oi-005-1', 'ord-005', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 10.000, 52000.00, 42000.00, 26000.00, 10.00, 44909.09, 520000.00, 0.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('oi-005-2', 'ord-005', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 6.000, 36000.00, 30000.00, 10800.00, 10.00, 18654.55, 216000.00, 0.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('oi-005-3', 'ord-005', 'prd-011', 'Nước rửa chén Sunlight Thiên Nhiên 750g', 3.000, 30000.00, 24000.00, 5700.00, 10.00, 9845.45, 90000.00, 0.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('oi-005-4', 'ord-005', 'prd-002', 'Bia Tiger lon 330ml', 1.000, 24000.00, 14000.00, 0.00, 10.00, 0.00, 24000.00, 0.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- ord-006:
('oi-006-1', 'ord-006', 'prd-001', 'Nước ngọt Coca Cola lon 320ml', 10.000, 10000.00, 8000.00, 0.00, 10.00, 9090.91, 100000.00, 0.00, DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR)),
('oi-006-2', 'ord-006', 'prd-004', 'Mì Hảo Hảo Tôm Chua Cay 75g', 20.000, 4500.00, 3600.00, 0.00, 10.00, 8181.82, 90000.00, 0.00, DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR)),
('oi-006-3', 'ord-006', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 1.000, 55000.00, 42000.00, 0.00, 10.00, 5000.00, 55000.00, 0.00, DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR)),
-- ord-007:
('oi-007-1', 'ord-007', 'prd-002', 'Bia Tiger lon 330ml', 24.000, 18000.00, 14000.00, 0.00, 10.00, 39272.73, 432000.00, 0.00, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('oi-007-2', 'ord-007', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 5.000, 58000.00, 48000.00, 0.00, 10.00, 26363.64, 290000.00, 0.00, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('oi-007-3', 'ord-007', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 10.000, 36000.00, 30000.00, 0.00, 10.00, 32727.27, 360000.00, 0.00, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('oi-007-4', 'ord-007', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 6.000, 52000.00, 42000.00, 0.00, 10.00, 28454.55, 313000.00, 0.00, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
-- ord-008: (Có 2 chai nước mắm Nam Ngư sẽ được trả hàng)
('oi-008-1', 'ord-008', 'prd-006', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 2.000, 32000.00, 25000.00, 0.00, 10.00, 5818.18, 64000.00, 0.00, DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
('oi-008-2', 'ord-008', 'prd-002', 'Bia Tiger lon 330ml', 12.000, 18000.00, 14000.00, 0.00, 10.00, 19636.36, 216000.00, 0.00, DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
('oi-008-3', 'ord-008', 'prd-001', 'Nước ngọt Coca Cola lon 320ml', 22.000, 10000.00, 8000.00, 0.00, 10.00, 20000.00, 220000.00, 0.00, DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
-- ord-009: Cân theo kg
('oi-009-1', 'ord-009', 'prd-009', 'Gạo thơm đặc sản ST25', 10.000, 35000.00, 28000.00, 0.00, 0.00, 0.00, 350000.00, 0.00, DATE_SUB(NOW(), INTERVAL 16 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR)),
('oi-009-2', 'ord-009', 'prd-010', 'Thịt heo ba chỉ tươi ngon', 2.086, 140000.00, 110000.00, 0.00, 0.00, 0.00, 292000.00, 0.00, DATE_SUB(NOW(), INTERVAL 16 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR)),
-- ord-010: Hủy
('oi-010-1', 'ord-010', 'prd-002', 'Bia Tiger lon 330ml', 24.000, 18000.00, 14000.00, 0.00, 10.00, 39272.73, 432000.00, 0.00, DATE_SUB(NOW(), INTERVAL 15 HOUR), DATE_SUB(NOW(), INTERVAL 15 HOUR)),
-- ord-011:
('oi-011-1', 'ord-011', 'prd-001', 'Nước ngọt Coca Cola lon 320ml', 6.000, 10000.00, 8000.00, 0.00, 10.00, 5454.55, 60000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('oi-011-2', 'ord-011', 'prd-003', 'Nước khoáng tinh khiết Aquafina 500ml', 5.000, 6000.00, 4000.00, 0.00, 10.00, 2727.27, 30000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('oi-011-3', 'ord-011', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 1.000, 50000.00, 42000.00, 0.00, 10.00, 4545.45, 50000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
-- ord-012:
('oi-012-1', 'ord-012', 'prd-009', 'Gạo thơm đặc sản ST25', 10.000, 35000.00, 28000.00, 0.00, 0.00, 0.00, 350000.00, 0.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('oi-012-2', 'ord-012', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 2.000, 58000.00, 48000.00, 0.00, 10.00, 10545.45, 116000.00, 0.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
-- ord-013: Treo Bàn 02
('oi-013-1', 'ord-013', 'prd-002', 'Bia Tiger lon 330ml', 4.000, 18000.00, 14000.00, 0.00, 10.00, 6545.45, 72000.00, 0.00, DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
-- ord-014: Lỗi thuế
('oi-014-1', 'ord-014', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 5.000, 36000.00, 30000.00, 0.00, 10.00, 16363.64, 180000.00, 0.00, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('oi-014-2', 'ord-014', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 2.000, 52000.00, 42000.00, 0.00, 10.00, 9454.55, 104000.00, 0.00, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('oi-014-3', 'ord-014', 'prd-003', 'Nước khoáng tinh khiết Aquafina 500ml', 4.000, 6500.00, 4000.00, 0.00, 10.00, 2363.64, 26000.00, 0.00, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
-- ord-pos2-001: Quầy 2 bán hôm qua
('oi-p2-001-1', 'ord-pos2-001', 'prd-001', 'Nước ngọt Coca Cola lon 320ml', 2.000, 10000.00, 8000.00, 0.00, 10.00, 1818.18, 20000.00, 0.00, DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),
('oi-p2-001-2', 'ord-pos2-001', 'prd-002', 'Bia Tiger lon 330ml', 2.000, 18000.00, 14000.00, 0.00, 10.00, 3272.73, 36000.00, 0.00, DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),
('oi-p2-001-3', 'ord-pos2-001', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 1.000, 52000.00, 42000.00, 0.00, 10.00, 4727.27, 52000.00, 0.00, DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),
-- ord-pos2-002: Quầy 2 bán sáng nay
('oi-p2-002-1', 'ord-pos2-002', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 2.000, 36000.00, 30000.00, 0.00, 10.00, 6545.45, 72000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('oi-p2-002-2', 'ord-pos2-002', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 1.000, 58000.00, 48000.00, 0.00, 10.00, 5272.73, 58000.00, 0.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- 4.5. Chi tiết các giao dịch thanh toán (Order Payments)
INSERT INTO `order_payments` (`id`, `household_id`, `order_id`, `payment_method`, `amount`, `amount_given`, `change_amount`, `transaction_code`, `notes`, `is_confirmed`, `confirmed_by_user_id`, `confirmed_at`, `created_at`, `updated_at`) VALUES
('op-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-001', 'BANK_TRANSFER', 1216000.00, 1216000.00, 0.00, 'MB-FT260917-889922', 'Chuyển khoản VietQR qua app ngân hàng MB', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('op-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-002', 'CASH', 360000.00, 400000.00, 40000.00, NULL, 'Khách đưa 400.000 đ, thối lại 40.000 đ', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('op-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-004', 'BANK_TRANSFER', 480000.00, 480000.00, 0.00, 'VCB-260921-991122', 'Vietcombank Digibank QR', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('op-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-005', 'BANK_TRANSFER', 807500.00, 807500.00, 0.00, 'TCB-260922-334455', 'Techcombank Chuyển khoản', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('op-006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-006', 'CASH', 245000.00, 250000.00, 5000.00, NULL, 'Tiền mặt tại quầy', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR)),
-- Đơn 7: Thanh toán kết hợp 2 phần (CASH 500k + BANK_TRANSFER 895k)
('op-007-1', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-007', 'CASH', 500000.00, 500000.00, 0.00, NULL, 'Thanh toán tiền mặt phần 1', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('op-007-2', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-007', 'BANK_TRANSFER', 895000.00, 895000.00, 0.00, 'BIDV-260923-112233', 'Quét mã VietQR phần 2', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('op-008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-008', 'CASH', 500000.00, 500000.00, 0.00, NULL, 'Tiền mặt', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
('op-009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-009', 'CASH', 642000.00, 650000.00, 8000.00, NULL, 'Tiền mặt', 1, 'usr-staff-chieu', DATE_SUB(NOW(), INTERVAL 16 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR)),
('op-011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-011', 'CASH', 140000.00, 200000.00, 60000.00, NULL, 'Tiền mặt tại quầy', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('op-012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-012', 'BANK_TRANSFER', 466000.00, 466000.00, 0.00, 'ACB-260924-445566', 'Chuyển khoản ACB', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('op-014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-014', 'BANK_TRANSFER', 310000.00, 310000.00, 0.00, 'VPB-260924-778899', 'VPBank QR', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('op-p2-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-pos2-001', 'CASH', 108000.00, 200000.00, 92000.00, NULL, 'Tiền mặt tại Quầy 2', 1, 'usr-staff-pos2', DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),
('op-p2-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-pos2-002', 'BANK_TRANSFER', 130000.00, 130000.00, 0.00, 'VCB-POS2-260924-01', 'Vietcombank QR tại Quầy 2', 1, 'usr-staff-pos2', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- 4.6. Hóa đơn điện tử (E-Invoices)
INSERT INTO `e_invoices` (`id`, `household_id`, `order_id`, `original_invoice_id`, `created_by_user_id`, `canceled_by_user_id`, `invoice_number`, `invoice_pattern`, `invoice_symbol`, `buyer_name`, `buyer_tax_code`, `buyer_address`, `buyer_phone`, `buyer_email`, `total_amount_before_tax`, `tax_amount`, `discount_amount`, `final_amount`, `status`, `tax_authority_code`, `tax_authority_response`, `cancel_reason`, `lookup_code`, `sent_to_tax_at`, `tax_response_at`, `canceled_at`, `created_at`, `updated_at`, `footer_note`, `title`, `retry_count`, `max_retry_count`, `last_retry_at`, `next_retry_at`, `is_error_notified`, `payment_method`, `customer_delivery_status`, `point_discount_amount`, `points_redeemed`, `error_category`) VALUES
-- inv-001: Đã cấp mã CQT
('inv-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-001', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000001', '1', '1C26TAA', 'Chị Lan (Khách VIP Chiết Khấu)', '0312456789', 'Số 88 Hai Bà Trưng, Quận 1', '0987654322', 'lan.tran@lanfashion.vn', 1105454.55, 110545.45, 64000.00, 1216000.00, 'ISSUED', '26002345000000000101', 'Cơ quan thuế chấp nhận hóa đơn hợp lệ và đã cấp mã', NULL, 'BHV26091701', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 'Cảm ơn quý khách', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0, NULL),
-- inv-002: Đã cấp mã CQT
('inv-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-002', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000002', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 327272.73, 32727.27, 0.00, 360000.00, 'ISSUED', '26002345000000000102', 'Cơ quan thuế chấp nhận hóa đơn hợp lệ và đã cấp mã', NULL, 'BHV26091901', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 'Cảm ơn quý khách', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'CASH', 'DELIVERED', 0.00, 0, NULL),
-- inv-004: Đã cấp mã CQT
('inv-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-004', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000003', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 436363.64, 43636.36, 0.00, 480000.00, 'ISSUED', '26002345000000000103', 'Cơ quan thuế chấp nhận hóa đơn hợp lệ và đã cấp mã', NULL, 'BHV26092101', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'Cảm ơn quý khách', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0, NULL),
-- inv-005: Đã cấp mã CQT
('inv-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-005', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000004', '1', '1C26TAA', 'Chị Lan (Khách VIP Chiết Khấu)', '0312456789', 'Số 88 Hai Bà Trưng, Quận 1', '0987654322', 'lan.tran@lanfashion.vn', 734090.91, 73409.09, 42500.00, 807500.00, 'ISSUED', '26002345000000000104', 'Cơ quan thuế chấp nhận hóa đơn hợp lệ và đã cấp mã', NULL, 'BHV26092201', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'Cảm ơn quý khách', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0, NULL),
-- inv-007: Đã cấp mã CQT
('inv-007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-007', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000005', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 1268181.82, 126818.18, 0.00, 1395000.00, 'ISSUED', '26002345000000000105', 'Cơ quan thuế chấp nhận hóa đơn hợp lệ và đã cấp mã', NULL, 'BHV26092301', DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR), 'Cảm ơn quý khách', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'COMBINED', 'DELIVERED', 0.00, 0, NULL),
-- inv-008-orig: Hóa đơn gốc (đã bị điều chỉnh vì khách trả hàng)
('inv-008-orig', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-008', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000006', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 454545.45, 45454.55, 0.00, 500000.00, 'ADJUSTED', '26002345000000000106', 'Đã cấp mã, sau đó được điều chỉnh giảm bởi HĐ 00000007', NULL, 'BHV26092302', DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 18 HOUR), 'Hóa đơn gốc', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'CASH', 'DELIVERED', 0.00, 0, NULL),
-- inv-008-adj: HÓA ĐƠN ĐIỀU CHỈNH GIẢM (Điều chỉnh giảm 64.000 đ do trả 2 chai nước mắm Nam Ngư)
('inv-008-adj', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-008', 'inv-008-orig', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000007', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 58181.82, 5818.18, 0.00, 64000.00, 'ISSUED', '26002345000000000107', 'Cơ quan thuế chấp nhận hóa đơn điều chỉnh giảm', NULL, 'BHV26092303', DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 18 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 18 HOUR), 'Điều chỉnh giảm 64.000 đ cho hóa đơn số 00000006', 'HÓA ĐƠN ĐIỀU CHỈNH', 0, 3, NULL, NULL, 0, 'CASH', 'DELIVERED', 0.00, 0, NULL),
-- inv-012: Đang chờ cấp mã CQT (WAITING_TAX_CODE)
('inv-012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-012', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000008', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 455454.55, 10545.45, 0.00, 466000.00, 'WAITING_TAX_CODE', NULL, 'Đang gửi dữ liệu lên Cơ quan Thuế...', NULL, 'BHV26092401', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Cảm ơn quý khách', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'BANK_TRANSFER', 'PENDING', 0.00, 0, NULL),
-- inv-014: Lỗi gửi thuế để test retry queue (SEND_ERROR)
('inv-014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-014', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, '00000009', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy', NULL, 'Tại quầy', '0900000001', NULL, 281818.18, 28181.82, 0.00, 310000.00, 'SEND_ERROR', NULL, 'Cổng TCT phản hồi: Lỗi kết nối mạng (Gateway Timeout), đang trong hàng đợi tự động gửi lại', NULL, 'BHV26092402', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'Đang chờ xử lý retry', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 1, 3, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 1, 'BANK_TRANSFER', 'FAILED', 0.00, 0, 'NETWORK_TIMEOUT'),
-- inv-pos2-001: Hóa đơn điện tử Quầy 2 xuất và được CQT cấp mã thành công
('inv-pos2-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ord-pos2-002', NULL, 'usr-staff-pos2', NULL, '00000010', '1', '1C26TAA', 'Khách Lẻ Mua Tại Quầy 2', NULL, '456 Nguyễn Huệ, Quận 1, TP. HCM', '0900000002', NULL, 118181.82, 11818.18, 0.00, 130000.00, 'ISSUED', '26002345000000000110', 'Cơ quan thuế chấp nhận hóa đơn hợp lệ và đã cấp mã', NULL, 'BHV26092410', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Hóa đơn Quầy 2 Chi nhánh Nguyễn Huệ', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 0, 3, NULL, NULL, 0, 'BANK_TRANSFER', 'DELIVERED', 0.00, 0, NULL);

-- Chi tiết hóa đơn điện tử e_invoice_items
INSERT INTO `e_invoice_items` (`id`, `invoice_id`, `product_id`, `product_name`, `unit`, `quantity`, `unit_price`, `tax_rate_percentage`, `tax_amount`, `discount_amount`, `subtotal`, `created_at`) VALUES
('eii-001-1', 'inv-001', 'prd-001', 'Nước ngọt Coca Cola lon 320ml', 'Lon', 48.000, 9000.00, 10.00, 39272.73, 24000.00, 432000.00, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('eii-001-2', 'inv-001', 'prd-002', 'Bia Tiger lon 330ml', 'Lon', 24.000, 18000.00, 10.00, 39272.73, 20000.00, 432000.00, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('eii-001-3', 'inv-001', 'prd-004', 'Mì Hảo Hảo Tôm Chua Cay 75g', 'Gói', 90.000, 4622.22, 10.00, 32000.00, 20000.00, 416000.00, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('eii-002-1', 'inv-002', 'prd-002', 'Bia Tiger lon 330ml', 'Lon', 20.000, 18000.00, 10.00, 32727.27, 0.00, 360000.00, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('eii-004-1', 'inv-004', 'prd-006', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 'Chai', 5.000, 32000.00, 10.00, 14545.45, 0.00, 160000.00, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('eii-004-2', 'inv-004', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 'Chai', 4.000, 58000.00, 10.00, 21090.91, 0.00, 232000.00, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('eii-008-adj', 'inv-008-adj', 'prd-006', 'Điều chỉnh giảm: Nước mắm Nam Ngư Đệ Nhị 900ml', 'Chai', 2.000, 32000.00, 10.00, 5818.18, 0.00, 64000.00, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
('eii-014-1', 'inv-014', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 'Hộp', 5.000, 36000.00, 10.00, 16363.64, 0.00, 180000.00, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('eii-014-2', 'inv-014', 'prd-008', 'Bánh Chocopie Orion hộp 12 cái 396g', 'Hộp', 2.000, 52000.00, 10.00, 9454.55, 0.00, 104000.00, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('eii-p2-001-1', 'inv-pos2-001', 'prd-007', 'Sữa tươi tiệt trùng Vinamilk 1L', 'Hộp', 2.000, 36000.00, 10.00, 6545.45, 0.00, 72000.00, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('eii-p2-001-2', 'inv-pos2-001', 'prd-005', 'Dầu ăn Simply nguyên chất 1L', 'Chai', 1.000, 58000.00, 10.00, 5272.73, 0.00, 58000.00, DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- Nhật ký trạng thái hóa đơn & Gửi nhận khách hàng
INSERT INTO `invoice_status_logs` (`id`, `invoice_id`, `from_status`, `to_status`, `changed_by_user_id`, `notes`, `created_at`) VALUES
('isl-001', 'inv-001', 'DRAFT', 'ISSUED', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Ký số và nhận mã CQT thành công', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('isl-008', 'inv-008-orig', 'ISSUED', 'ADJUSTED', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Khách trả hàng - Lập hóa đơn điều chỉnh số 00000007', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
('isl-014', 'inv-014', 'WAITING_TAX_CODE', 'SEND_ERROR', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Lỗi timeout kết nối CQT lần 1', DATE_SUB(NOW(), INTERVAL 15 MINUTE));

INSERT INTO `invoice_delivery_logs` (`id`, `invoice_id`, `channel`, `recipient_address`, `status`, `error_message`, `sent_at`, `created_at`) VALUES
('idl-001', 'inv-001', 'EMAIL', 'lan.tran@lanfashion.vn', 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('idl-002', 'inv-001', 'ZALO', '0987654322', 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY));

-- 4.7. Thông báo hóa đơn sai sót gửi Cơ quan Thuế Mẫu 04/SS-HĐĐT
INSERT INTO `invoice_error_notices` (`id`, `household_id`, `created_by_user_id`, `notice_code`, `notice_type`, `notice_place`, `tax_authority_code`, `tax_authority_name`, `status`, `sent_to_tax_at`, `tax_response_at`, `tax_authority_response`, `created_at`, `updated_at`) VALUES
('notice-04ss-01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'TB-04SS-2026-001', 'EXPLANATION', 'TP. Hồ Chí Minh', '79000', 'Chi cục Thuế Quận 1', 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 17 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR), 'Cơ quan thuế thông báo chấp nhận giải trình sai sót theo Mẫu 04/SS-HĐĐT', DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 16 HOUR));

INSERT INTO `invoice_error_notice_items` (`id`, `notice_id`, `invoice_id`, `invoice_pattern`, `invoice_symbol`, `invoice_number`, `tax_authority_code`, `handling_type`, `reason`, `created_at`) VALUES
('item-04ss-01', 'notice-04ss-01', 'inv-008-orig', '1', '1C26TAA', '00000006', '26002345000000000106', 'ADJUSTMENT', 'Khách hàng đổi trả lại 2 chai Nước mắm Nam Ngư do mua nhầm chủng loại', DATE_SUB(NOW(), INTERVAL 18 HOUR));

-- 4.8. Phiếu trả hàng bán (Return Tickets)
INSERT INTO `return_tickets` (`id`, `household_id`, `ticket_number`, `original_order_id`, `original_invoice_id`, `customer_id`, `created_by_user_id`, `approved_by_user_id`, `refund_payment_method`, `total_return_amount`, `points_deducted`, `status`, `reason`, `approved_at`, `created_at`, `updated_at`) VALUES
('rt-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TH-20260923-001', 'ord-008', 'inv-008-orig', 'cust-001', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'CASH', 64000.00, 0, 'APPROVED', 'Khách hàng trả lại 2 chai nước mắm mua nhầm chủng loại trong ngày', DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 18 HOUR));

INSERT INTO `return_ticket_items` (`id`, `return_ticket_id`, `product_id`, `product_name`, `unit`, `quantity`, `unit_price`, `tax_rate_percentage`, `tax_amount`, `subtotal`, `created_at`) VALUES
('rti-001', 'rt-001', 'prd-006', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 'Chai', 2.000, 32000.00, 10.00, 5818.18, 64000.00, DATE_SUB(NOW(), INTERVAL 18 HOUR));

-- 4.9. Phiếu nhập kho (Goods Receipts) & Công nợ NCC (Supplier Debts)
INSERT INTO `goods_receipts` (`id`, `household_id`, `receipt_number`, `supplier_id`, `created_by_user_id`, `total_amount`, `received_at`, `notes`, `created_at`, `updated_at`) VALUES
-- Nhập từ Nhà cung cấp Nước giải khát Quốc tế
('rcpt-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PNK-20260915-001', 'sup-001', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 3820000.00, DATE_SUB(NOW(), INTERVAL 9 DAY), 'Chủ hộ nhập bổ sung Coca Cola và Bia Tiger về Kho tổng', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
-- Nhập từ Tiến Phát (Mì ăn liền & Dầu ăn)
('rcpt-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PNK-20260918-001', 'sup-002', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 4920000.00, DATE_SUB(NOW(), INTERVAL 6 DAY), 'Chủ hộ nhập mì tôm Hảo Hảo và dầu Simply về Kho tổng', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT INTO `goods_receipt_details` (`id`, `receipt_id`, `product_id`, `quantity`, `purchase_price`, `unit_name`, `conversion_factor`, `base_quantity`, `base_purchase_price`, `created_at`) VALUES
-- rcpt-001
('rcd-001-1', 'rcpt-001', 'prd-001', 10.000, 192000.00, 'Thùng', 24.000, 240.000, 8000.00, DATE_SUB(NOW(), INTERVAL 9 DAY)),
('rcd-001-2', 'rcpt-001', 'prd-002', 5.000, 380000.00, 'Thùng', 24.000, 120.000, 15833.33, DATE_SUB(NOW(), INTERVAL 9 DAY)),
-- rcpt-002
('rcd-002-1', 'rcpt-002', 'prd-004', 20.000, 108000.00, 'Thùng', 30.000, 600.000, 3600.00, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('rcd-002-2', 'rcpt-002', 'prd-005', 50.000, 48000.00, 'Chai', 1.000, 50.000, 48000.00, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('rcd-002-3', 'rcpt-002', 'prd-006', 14.400, 25000.00, 'Chai', 1.000, 14.400, 25000.00, DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Công nợ nhà cung cấp (sup-001 còn nợ 3.500.000 đ)
INSERT INTO `supplier_debts` (`id`, `household_id`, `supplier_id`, `goods_receipt_id`, `amount`, `remaining_amount`, `type`, `status`, `payment_method`, `due_date`, `notes`, `created_by_user_id`, `created_at`, `updated_at`) VALUES
('sd-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sup-001', 'rcpt-001', 3820000.00, 3500000.00, 'PURCHASE', 'PARTIALLY_PAID', 'BANK_TRANSFER', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Đã thanh toán trước 320k, còn nợ 3.5tr theo hạn mức 15 ngày', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY));

-- Trả hàng Nhà cung cấp (Trả 2 thùng mì Hảo Hảo bị bẹp góc khi giao)
INSERT INTO `supplier_returns` (`id`, `household_id`, `supplier_id`, `receipt_id`, `created_by_user_id`, `return_number`, `return_date`, `reason`, `total_return_amount`, `notes`, `created_at`, `updated_at`) VALUES
('sret-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sup-002', 'rcpt-002', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'TRA-NCC-20260919-01', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Hàng bị móp méo vỏ thùng', 216000.00, 'NCC đã xác nhận đổi trừ vào công nợ đơn sau', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO `supplier_return_items` (`id`, `supplier_return_id`, `receipt_detail_id`, `product_id`, `quantity`, `purchase_price`, `subtotal`, `base_quantity`, `base_purchase_price`, `unit_name`, `conversion_factor`, `item_reason`, `created_at`) VALUES
('sri-001', 'sret-001', 'rcd-002-1', 'prd-004', 2.000, 108000.00, 216000.00, 60.000, 3600.00, 'Thùng', 30.000, 'Vỏ thùng carton bị rách móp khi bốc dỡ', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- 4.10. Phiếu kiểm kê kho có giải trình lệch tồn thực tế (Inventory Audits)
INSERT INTO `inventory_audits` (`id`, `household_id`, `created_by_user_id`, `audit_number`, `audit_date`, `status`, `total_items`, `total_difference_qty`, `notes`, `created_at`, `updated_at`) VALUES
('ia-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'KK-20260922-01', DATE_SUB(NOW(), INTERVAL 2 DAY), 'COMPLETED', 3, -3.500, 'Chủ hộ kiểm kê định kỳ giữa tuần quầy tạp hóa và kho hàng', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `inventory_audit_details` (`id`, `audit_id`, `product_id`, `system_quantity`, `actual_quantity`, `difference_quantity`, `reason`, `created_at`) VALUES
('iad-001', 'ia-001', 'prd-001', 240.000, 238.000, -2.000, 'Lệch -2 lon: Bị bẹp vỏ rách khi xếp hàng lên kệ trưng bày, đã bỏ hủy', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('iad-002', 'ia-001', 'prd-004', 450.000, 450.000, 0.000, 'Khớp hoàn toàn 100% sổ sách', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('iad-003', 'ia-001', 'prd-009', 500.000, 498.500, -1.500, 'Lệch -1.5 kg: Hao hụt tự nhiên do cân đong bán lẻ cho khách hàng', DATE_SUB(NOW(), INTERVAL 2 DAY));


-- -------------------------------------------------------------------------------------
-- 4.11. Điều chuyển hàng hóa nội bộ từ Kho gốc sang các Quầy bán (Pos Transfers)
-- Minh chứng rõ nét: Hàng nhập về Kho tổng POS-03, sau đó điều chuyển sang Quầy 1 & Quầy 2
-- -------------------------------------------------------------------------------------
INSERT INTO `pos_transfers` (`id`, `household_id`, `transfer_number`, `from_point_of_sale_id`, `to_point_of_sale_id`, `created_by_user_id`, `received_by_user_id`, `canceled_by_user_id`, `status`, `total_items`, `total_quantity`, `notes`, `cancel_reason`, `transferred_at`, `received_at`, `canceled_at`, `created_at`, `updated_at`) VALUES
-- Phiếu 1: Kho tổng POS-03 -> Quầy 1 POS-01 (Hoàn tất)
('transfer-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CK-20260920-001', '59eb910e-6498-49aa-adf6-ae254d9f43b8', 'bfa331e4-14dd-4708-8071-5a6aca59db57', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'COMPLETED', 4, 246.000, 'Xuất kho tổng điều chuyển bổ sung cho Quầy 1 bán tuần', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
-- Phiếu 2: Kho tổng POS-03 -> Quầy 2 POS-02 (Hoàn tất)
('transfer-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CK-20260921-002', '59eb910e-6498-49aa-adf6-ae254d9f43b8', '5708ab97-37de-41c3-92b6-292aac138b92', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'usr-staff-pos2', NULL, 'COMPLETED', 5, 146.000, 'Điều chuyển từ Kho tổng sang Chi nhánh 2 (Quầy 2) phục vụ bán hàng', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- Phiếu 3: Kho tổng POS-03 -> Quầy 2 POS-02 (Đang trên đường vận chuyển)
('transfer-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CK-20260924-003', '59eb910e-6498-49aa-adf6-ae254d9f43b8', '5708ab97-37de-41c3-92b6-292aac138b92', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', NULL, NULL, 'IN_TRANSIT', 2, 30.000, 'Hàng đang trên đường vận chuyển xe máy sang Quầy 2 Chi nhánh 2', NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO `pos_transfer_items` (`id`, `transfer_id`, `product_id`, `product_sku`, `product_name`, `unit`, `quantity`, `created_at`, `updated_at`) VALUES
-- Chi tiết phiếu CK-20260920-001 (Kho tổng -> Quầy 1)
('ti-001-1', 'transfer-001', 'prd-001', 'SKU-COCA-320', 'Nước ngọt Coca Cola lon 320ml', 'Lon', 72.000, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ti-001-2', 'transfer-001', 'prd-004', 'SKU-HAOHAO-TCC', 'Mì Hảo Hảo Tôm Chua Cay 75g', 'Gói', 120.000, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ti-001-3', 'transfer-001', 'prd-005', 'SKU-SIMPLY-1L', 'Dầu ăn Simply nguyên chất 1L', 'Chai', 24.000, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ti-001-4', 'transfer-001', 'prd-006', 'SKU-NAMNGU-900', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 'Chai', 30.000, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
-- Chi tiết phiếu CK-20260921-002 (Kho tổng -> Quầy 2)
('ti-002-1', 'transfer-002', 'prd-001', 'SKU-COCA-320', 'Nước ngọt Coca Cola lon 320ml', 'Lon', 36.000, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ti-002-2', 'transfer-002', 'prd-002', 'SKU-TIGER-330', 'Bia Tiger lon 330ml', 'Lon', 24.000, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ti-002-3', 'transfer-002', 'prd-004', 'SKU-HAOHAO-TCC', 'Mì Hảo Hảo Tôm Chua Cay 75g', 'Gói', 60.000, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ti-002-4', 'transfer-002', 'prd-007', 'SKU-VNM-1L', 'Sữa tươi tiệt trùng Vinamilk 1L', 'Hộp', 18.000, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ti-002-5', 'transfer-002', 'prd-008', 'SKU-CHOCO-12', 'Bánh Chocopie Orion hộp 12 cái 396g', 'Hộp', 8.000, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- Chi tiết phiếu CK-20260924-003 (Kho tổng -> Quầy 2 đang giao)
('ti-003-1', 'transfer-003', 'prd-003', 'SKU-AQUA-500', 'Nước khoáng tinh khiết Aquafina 500ml', 'Chai', 24.000, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('ti-003-2', 'transfer-003', 'prd-005', 'SKU-SIMPLY-1L', 'Dầu ăn Simply nguyên chất 1L', 'Chai', 6.000, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 4.12. Thu chi quỹ tiền mặt ngoài bán hàng (Cash Transactions)
INSERT INTO `cash_transactions` (`id`, `household_id`, `shift_id`, `created_by_user_id`, `approved_by_user_id`, `category_id`, `category_name`, `code`, `type`, `amount`, `person_name`, `notes`, `status`, `created_at`, `updated_at`) VALUES
-- Thu tiền khách Hoàng trả nợ 500k
('ctx-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'cat-001', 'Thu tiền nợ khách hàng', 'PT-20260923-01', 'INCOME', 500000.00, 'Anh Hoàng (Khách Quen)', 'Khách trả bớt tiền mua nợ đơn hàng trước', 'APPROVED', DATE_SUB(NOW(), INTERVAL 25 HOUR), DATE_SUB(NOW(), INTERVAL 25 HOUR)),
-- Thu thanh lý bao bì vỏ thùng carton
('ctx-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-01-closed', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'cat-002', 'Thu nhập khác ngoài bán hàng', 'PT-20260923-02', 'INCOME', 150000.00, 'Cô Ve Chai', 'Thu bán vỏ bìa carton và két chai rỗng', 'APPROVED', DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),
-- Chi trả tiền hàng NCC Tiến Phát 2.000.000 đ
('ctx-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-02-closed', 'usr-staff-chieu', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'cat-003', 'Chi trả tiền hàng cho Nhà cung cấp', 'PC-20260923-01', 'EXPENSE', 2000000.00, 'Anh Tiến (Đại lý Tiến Phát)', 'Thanh toán tiền mặt đợt 1 phiếu nhập PNK-20260918-001', 'APPROVED', DATE_SUB(NOW(), INTERVAL 17 HOUR), DATE_SUB(NOW(), INTERVAL 17 HOUR)),
-- Chi tiền điện tháng trước
('ctx-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-02-closed', 'usr-staff-chieu', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'cat-004', 'Chi điện nước & Mạng Internet', 'PC-20260923-02', 'EXPENSE', 1250000.00, 'Công ty Điện Lực Sài Gòn', 'Hóa đơn tiền điện chiếu sáng quầy bán và tủ mát', 'APPROVED', DATE_SUB(NOW(), INTERVAL 14 HOUR), DATE_SUB(NOW(), INTERVAL 14 HOUR)),
-- Chi mua túi xốp & văn phòng phẩm
('ctx-005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'shift-03-open', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'cat-005', 'Chi tiêu vặt & Nước uống nhân viên', 'PC-20260924-01', 'EXPENSE', 120000.00, 'Cửa hàng Bao Bì Tuấn', 'Mua 5kg túi xốp quai xách đựng hàng cho khách', 'APPROVED', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 4.13. Sổ nợ khách hàng (Customer Debts) & Biên bản đối chiếu nợ
INSERT INTO `customer_debts` (`id`, `household_id`, `customer_id`, `order_id`, `amount`, `remaining_amount`, `type`, `status`, `due_date`, `notes`, `reminder_sent`, `overdue_reminder_sent`, `is_locked`, `created_by_user_id`, `created_at`, `updated_at`) VALUES
('cd-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cust-002', 'ord-003', 1250000.00, 1250000.00, 'DEBT_CREATED', 'PENDING', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Anh Hoàng mua nợ đơn hàng ORD-20260920-001 hẹn trả cuối tuần', 1, 0, 0, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Biên bản đối chiếu công nợ tháng
INSERT INTO `customer_debt_reconciliations` (`id`, `household_id`, `customer_id`, `created_by_user_id`, `confirmed_by_user_id`, `code`, `start_date`, `end_date`, `opening_debt_balance`, `total_debt_incurred`, `total_debt_paid`, `closing_debt_balance`, `closing_debt_in_words`, `status`, `notes`, `confirmed_at`, `created_at`, `updated_at`) VALUES
('cdr-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cust-002', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DC-202609-001', DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), CURRENT_DATE, 500000.00, 1250000.00, 500000.00, 1250000.00, 'Một triệu hai trăm năm mươi nghìn đồng', 'CONFIRMED', 'Đã đối chiếu trực tiếp và có chữ ký xác nhận số dư nợ của Anh Hoàng', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO `customer_debt_reconciliation_items` (`id`, `reconciliation_id`, `customer_debt_id`, `transaction_date`, `type`, `amount`, `running_balance`, `reference_code`, `notes`, `created_at`) VALUES
('cdri-001', 'cdr-001', 'cd-001', DATE_SUB(NOW(), INTERVAL 4 DAY), 'DEBT_CREATED', 1250000.00, 1750000.00, 'ORD-20260920-001', 'Mua chịu nhu yếu phẩm dầu ăn sữa tươi bánh kẹo', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('cdri-002', 'cdr-001', NULL,     DATE_SUB(NOW(), INTERVAL 25 HOUR), 'DEBT_PAID', 500000.00, 1250000.00, 'PT-20260923-01', 'Anh Hoàng thanh toán tiền mặt trả nợ cũ', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 4.14. Cảnh báo bất thường (Anomaly Alerts) & Thông báo (Notifications)
INSERT INTO `anomaly_alerts` (`id`, `household_id`, `actor_user_id`, `reviewed_by_user_id`, `alert_type`, `severity`, `title`, `description`, `evidence_data`, `status`, `review_notes`, `detected_at`, `reviewed_at`, `created_at`, `updated_at`) VALUES
('aa-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'UNUSUAL_HIGH_DISCOUNT', 'WARNING', 'Chiết khấu vượt ngưỡng thông thường', 'Nhân viên thu ngân áp dụng giảm giá 25% cho đơn hàng đặc biệt', '{"order_id": "ord-001", "discount_percentage": 25, "threshold": 10}', 'REVIEWED', 'Đã duyệt: Khách hàng mua số lượng lớn theo hợp đồng sỉ đã được chủ hộ đồng ý trước', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('aa-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'usr-staff-chieu', NULL, 'RAPID_FAILED_LOGINS', 'INFO', 'Đăng nhập sai mật khẩu liên tiếp', 'Có 3 lần nhập sai mật khẩu tài khoản thu ngân ca chiều trong vòng 2 phút', '{"username": "nhanvien_chieu", "failed_attempts": 3, "ip": "192.168.1.105"}', 'PENDING', NULL, DATE_SUB(NOW(), INTERVAL 20 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 20 HOUR));

INSERT INTO `app_notifications` (`id`, `household_id`, `user_id`, `title`, `message`, `notification_type`, `severity`, `is_read`, `is_closed`, `read_at`, `closed_at`, `created_at`, `updated_at`) VALUES
('notif-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Cảnh báo hàng sắp hết tồn kho', 'Mặt hàng Dầu ăn Simply 1L hiện chỉ còn 8 chai trên quầy, dưới mức tối thiểu 10 chai. Vui lòng lập phiếu nhập kho.', 'STOCK_LOW', 'WARNING', 0, 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR), NOW()),
('notif-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lỗi truyền nhận hóa đơn CQT', 'Hóa đơn số 00000009 gửi CQT bị timeout đường truyền. Hệ thống đang tự động xếp vào hàng đợi retry.', 'INVOICE_ERROR', 'CRITICAL', 0, 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW()),
('notif-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Nhắc nhở nộp tờ khai thuế Quý 3/2026', 'Chỉ còn 6 ngày nữa là đến hạn chốt sổ sách kê khai thuế quý 3. Kế toán vui lòng rà soát bảng kê mua vào và bán ra.', 'TAX_PERIOD_REMINDER', 'INFO', 1, 0, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('notif-004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Nhắc hạn công nợ khách hàng', 'Khách hàng Anh Hoàng có khoản nợ 1.250.000 đ sẽ đến hạn thanh toán trong 3 ngày tới.', 'DEBT_DUE', 'INFO', 0, 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW());

-- 4.15. Kỳ kê khai thuế (Tax Periods) & Bảng kê mua vào bán ra (Tax Registers)
INSERT INTO `tax_declaration_periods` (`id`, `household_id`, `created_by_user_id`, `locked_by_user_id`, `period_name`, `period_type`, `period_number`, `year`, `start_date`, `end_date`, `status`, `total_revenue`, `total_tax_amount`, `total_valid_invoices`, `total_purchase_amount`, `total_purchase_receipts`, `declaration_exported`, `created_at`, `updated_at`) VALUES
('tax-period-q3-2026', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', NULL, 'Kê khai thuế Quý 3 năm 2026', 'QUARTERLY', 3, 2026, '2026-07-01', '2026-09-30', 'DRAFT', 4678500.00, 386545.45, 6, 8740000.00, 2, 0, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW());

-- Bảng kê mua vào (từ phiếu nhập kho)
INSERT INTO `tax_purchase_registers` (`id`, `period_id`, `receipt_id`, `receipt_detail_id`, `supplier_id`, `product_id`, `receipt_number`, `receipt_date`, `supplier_name`, `supplier_tax_code`, `product_code`, `product_name`, `unit_name`, `base_quantity`, `base_purchase_price`, `total_amount`, `is_supplier_missing`, `notes`, `created_at`) VALUES
('tpr-001', 'tax-period-q3-2026', 'rcpt-001', 'rcd-001-1', 'sup-001', 'prd-001', 'PNK-20260915-001', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Công Ty Cổ Phần Nước Giải Khát Quốc Tế', '0301234567', 'SKU-COCA-320', 'Nước ngọt Coca Cola lon 320ml', 'Lon', 240.000, 8000.00, 1920000.00, 0, 'Hóa đơn đầu vào HĐ 0012345', DATE_SUB(NOW(), INTERVAL 9 DAY)),
('tpr-002', 'tax-period-q3-2026', 'rcpt-001', 'rcd-001-2', 'sup-001', 'prd-002', 'PNK-20260915-001', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Công Ty Cổ Phần Nước Giải Khát Quốc Tế', '0301234567', 'SKU-TIGER-330', 'Bia Tiger lon 330ml', 'Lon', 120.000, 15833.33, 1900000.00, 0, 'Hóa đơn đầu vào HĐ 0012345', DATE_SUB(NOW(), INTERVAL 9 DAY)),
('tpr-003', 'tax-period-q3-2026', 'rcpt-002', 'rcd-002-1', 'sup-002', 'prd-004', 'PNK-20260918-001', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Đại Lý Phân Phối Bánh Kẹo & Thực Phẩm Tiến Phát', '0307654321', 'SKU-HAOHAO-TCC', 'Mì Hảo Hảo Tôm Chua Cay 75g', 'Gói', 600.000, 3600.00, 2160000.00, 0, 'Hóa đơn đầu vào HĐ 0098765', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('tpr-004', 'tax-period-q3-2026', 'rcpt-002', 'rcd-002-2', 'sup-002', 'prd-005', 'PNK-20260918-001', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Đại Lý Phân Phối Bánh Kẹo & Thực Phẩm Tiến Phát', '0307654321', 'SKU-SIMPLY-1L', 'Dầu ăn Simply nguyên chất 1L', 'Chai', 50.000, 48000.00, 2400000.00, 0, 'Hóa đơn đầu vào HĐ 0098765', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Bảng kê bán ra (từ hóa đơn điện tử)
INSERT INTO `tax_sales_registers` (`id`, `period_id`, `invoice_id`, `invoice_pattern`, `invoice_symbol`, `invoice_number`, `invoice_type`, `issue_date`, `buyer_name`, `buyer_tax_code`, `revenue_amount`, `tax_rate_percentage`, `tax_amount`, `notes`, `created_at`) VALUES
('tsr-001', 'tax-period-q3-2026', 'inv-001', '1', '1C26TAA', '00000001', 'HÓA ĐƠN GTGT', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Chị Lan (Khách VIP Chiết Khấu)', '0312456789', 1105454.55, 10.00, 110545.45, 'Đã cấp mã CQT', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('tsr-002', 'tax-period-q3-2026', 'inv-002', '1', '1C26TAA', '00000002', 'HÓA ĐƠN GTGT', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Khách Lẻ Mua Tại Quầy', NULL, 327272.73, 10.00, 32727.27, 'Đã cấp mã CQT', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('tsr-003', 'tax-period-q3-2026', 'inv-004', '1', '1C26TAA', '00000003', 'HÓA ĐƠN GTGT', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Khách Lẻ Mua Tại Quầy', NULL, 436363.64, 10.00, 43636.36, 'Đã cấp mã CQT', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('tsr-004', 'tax-period-q3-2026', 'inv-005', '1', '1C26TAA', '00000004', 'HÓA ĐƠN GTGT', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Chị Lan (Khách VIP Chiết Khấu)', '0312456789', 734090.91, 10.00, 73409.09, 'Đã cấp mã CQT', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('tsr-005', 'tax-period-q3-2026', 'inv-007', '1', '1C26TAA', '00000005', 'HÓA ĐƠN GTGT', DATE_SUB(NOW(), INTERVAL 24 HOUR), 'Khách Lẻ Mua Tại Quầy', NULL, 1268181.82, 10.00, 126818.18, 'Đã cấp mã CQT', DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('tsr-006', 'tax-period-q3-2026', 'inv-008-adj', '1', '1C26TAA', '00000007', 'HÓA ĐƠN ĐIỀU CHỈNH', DATE_SUB(NOW(), INTERVAL 18 HOUR), 'Khách Lẻ Mua Tại Quầy', NULL, -58181.82, 10.00, -5818.18, 'Điều chỉnh giảm trả hàng', DATE_SUB(NOW(), INTERVAL 18 HOUR));

-- 4.16. Cấu hình sao lưu (Backup Configs) & Lịch sử sao lưu & Xác thực toàn vẹn
INSERT INTO `backup_configs` (`id`, `household_id`, `backup_type`, `scheduled_time`, `is_auto_backup_enabled`, `retention_count`, `created_at`, `updated_at`) VALUES
('bkc-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'FULL', '02:30', 1, 30, NOW(), NOW());

INSERT INTO `backup_histories` (`id`, `household_id`, `created_by_user_id`, `backup_type`, `trigger_type`, `file_name`, `file_path`, `file_size`, `status`, `notes`, `backup_time`, `created_at`) VALUES
('bh-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'FULL', 'AUTOMATIC', 'backup_banhangviet_20260922_023000.sql.gz', '/backups/households/a0eebc99/2026/09/backup_20260922_023000.sql.gz', 1458290, 'SUCCESS', 'Sao lưu tự động định kỳ ban đêm', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('bh-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'FULL', 'AUTOMATIC', 'backup_banhangviet_20260923_023000.sql.gz', '/backups/households/a0eebc99/2026/09/backup_20260923_023000.sql.gz', 1512400, 'SUCCESS', 'Sao lưu tự động định kỳ ban đêm', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('bh-003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'FULL', 'MANUAL', 'backup_banhangviet_manual_20260924_080000.sql.gz', '/backups/households/a0eebc99/2026/09/backup_manual_20260924.sql.gz', 1589120, 'SUCCESS', 'Chủ hộ chủ động sao lưu trước giờ mở cửa', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR));

INSERT INTO `backup_verification_histories` (`id`, `household_id`, `backup_history_id`, `backup_file_name`, `backup_time`, `file_size`, `execution_duration_ms`, `checked_file_readable`, `checked_record_counts_matched`, `checked_audit_chain_intact`, `customer_count`, `product_count`, `supplier_count`, `user_count`, `audit_log_count`, `status`, `trigger_type`, `verified_at`, `notes`, `created_at`) VALUES
('bvh-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bh-002', 'backup_banhangviet_20260923_023000.sql.gz', DATE_SUB(NOW(), INTERVAL 1 DAY), 1512400, 1850, 1, 1, 1, 3, 11, 2, 8, 145, 'PASSED', 'AUTOMATIC', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Kiểm tra toàn vẹn định kỳ đạt 100%, chuỗi băm audit không bị thay đổi', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('bvh-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bh-003', 'backup_banhangviet_manual_20260924_080000.sql.gz', DATE_SUB(NOW(), INTERVAL 3 HOUR), 1589120, 1920, 1, 1, 1, 3, 11, 2, 8, 168, 'PASSED', 'MANUAL', DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Xác thực bản sao lưu thủ công hoàn tất thành công', DATE_SUB(NOW(), INTERVAL 3 HOUR));


-- =====================================================================================
-- KẾT THÚC KHỞI TẠO CƠ SỞ DỮ LIỆU
-- =====================================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

COMMIT;
