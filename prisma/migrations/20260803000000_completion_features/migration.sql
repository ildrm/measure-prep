ALTER TABLE `sections` ADD COLUMN `difficulty_level` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `test_form_sections` ADD COLUMN `route_min_percent` DOUBLE NULL, ADD COLUMN `route_max_percent` DOUBLE NULL;
DROP INDEX `test_form_sections_test_form_id_order_key` ON `test_form_sections`;
CREATE INDEX `test_form_sections_test_form_id_order_idx` ON `test_form_sections`(`test_form_id`,`order`);

CREATE TABLE `auth_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `type` ENUM('EMAIL_VERIFICATION','PASSWORD_RESET') NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `auth_tokens_token_hash_key`(`token_hash`),
  INDEX `auth_tokens_user_id_type_idx`(`user_id`,`type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `feature_flags` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `exam_id` VARCHAR(191) NULL,
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `feature_flags_key_exam_id_key`(`key`,`exam_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `session_sections` (
  `id` VARCHAR(191) NOT NULL,
  `session_id` VARCHAR(191) NOT NULL,
  `section_id` VARCHAR(191) NOT NULL,
  `order` INTEGER NOT NULL,
  `status` ENUM('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
  `started_at` DATETIME(3) NOT NULL,
  `ends_at` DATETIME(3) NOT NULL,
  `submitted_at` DATETIME(3) NULL,
  UNIQUE INDEX `session_sections_session_id_section_id_key`(`session_id`,`section_id`),
  INDEX `session_sections_session_id_order_idx`(`session_id`,`order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `auth_tokens` ADD CONSTRAINT `auth_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `feature_flags` ADD CONSTRAINT `feature_flags_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `session_sections` ADD CONSTRAINT `session_sections_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `session_sections` ADD CONSTRAINT `session_sections_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
