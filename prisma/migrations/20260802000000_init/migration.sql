CREATE TABLE `users` (`id` VARCHAR(191) NOT NULL,`email` VARCHAR(191) NOT NULL,`name` VARCHAR(191) NOT NULL,`password_hash` VARCHAR(191) NOT NULL,`role` ENUM('STUDENT','CONTENT_EDITOR','ADMIN') NOT NULL DEFAULT 'STUDENT',`refresh_token_hash` TEXT NULL,`email_verified_at` DATETIME(3) NULL,`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),`updated_at` DATETIME(3) NOT NULL,UNIQUE INDEX `users_email_key`(`email`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exams` (`id` VARCHAR(191) NOT NULL,`code` ENUM('IELTS_AC','IELTS_GT','TOEFL','GRE') NOT NULL,`name` VARCHAR(191) NOT NULL,`description` TEXT NULL,UNIQUE INDEX `exams_code_key`(`code`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sections` (`id` VARCHAR(191) NOT NULL,`exam_id` VARCHAR(191) NOT NULL,`name` VARCHAR(191) NOT NULL,`order` INTEGER NOT NULL,`time_limit_sec` INTEGER NOT NULL,`skill` ENUM('READING','LISTENING','WRITING','SPEAKING','QUANT','VERBAL') NOT NULL,`instructions` TEXT NULL,UNIQUE INDEX `sections_exam_id_name_key`(`exam_id`,`name`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `passages` (`id` VARCHAR(191) NOT NULL,`section_id` VARCHAR(191) NOT NULL,`title` VARCHAR(191) NOT NULL,`body_richtext` LONGTEXT NOT NULL,`source_note` VARCHAR(191) NULL,PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audio_assets` (`id` VARCHAR(191) NOT NULL,`section_id` VARCHAR(191) NOT NULL,`storage_key` VARCHAR(191) NOT NULL,`duration_sec` INTEGER NOT NULL,`transcript` LONGTEXT NULL,PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_types` (`id` VARCHAR(191) NOT NULL,`code` ENUM('SINGLE_CHOICE','MULTI_SELECT','TRUE_FALSE_NOT_GIVEN','MATCHING','GAP_FILL','NUMERIC_ENTRY','QUANT_COMPARISON','ESSAY','SPEAKING_TASK') NOT NULL,`exam_id` VARCHAR(191) NOT NULL,`description` VARCHAR(191) NULL,UNIQUE INDEX `question_types_exam_id_code_key`(`exam_id`,`code`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `questions` (`id` VARCHAR(191) NOT NULL,`section_id` VARCHAR(191) NOT NULL,`passage_id` VARCHAR(191) NULL,`audio_asset_id` VARCHAR(191) NULL,`type_id` VARCHAR(191) NOT NULL,`prompt` TEXT NOT NULL,`order` INTEGER NOT NULL,`points` DOUBLE NOT NULL DEFAULT 1,`metadata` JSON NULL,UNIQUE INDEX `questions_section_id_order_key`(`section_id`,`order`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_options` (`id` VARCHAR(191) NOT NULL,`question_id` VARCHAR(191) NOT NULL,`label` VARCHAR(191) NOT NULL,`value` VARCHAR(191) NOT NULL,`is_correct` BOOLEAN NOT NULL DEFAULT false,`order` INTEGER NOT NULL,UNIQUE INDEX `question_options_question_id_order_key`(`question_id`,`order`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `answer_keys` (`id` VARCHAR(191) NOT NULL,`question_id` VARCHAR(191) NOT NULL,`accepted_answers_json` JSON NOT NULL,`match_strategy` ENUM('EXACT','CASE_INSENSITIVE','LEMMATIZED','NUMERIC_TOLERANCE','MULTI_EXACT','MULTI_PARTIAL','MANUAL','AI') NOT NULL,`tolerance` DOUBLE NULL,UNIQUE INDEX `answer_keys_question_id_key`(`question_id`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_forms` (`id` VARCHAR(191) NOT NULL,`exam_id` VARCHAR(191) NOT NULL,`name` VARCHAR(191) NOT NULL,`slug` VARCHAR(191) NOT NULL,`is_published` BOOLEAN NOT NULL DEFAULT false,`version` INTEGER NOT NULL DEFAULT 1,`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),UNIQUE INDEX `test_forms_slug_key`(`slug`),UNIQUE INDEX `test_forms_exam_id_name_version_key`(`exam_id`,`name`,`version`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_form_sections` (`id` VARCHAR(191) NOT NULL,`test_form_id` VARCHAR(191) NOT NULL,`section_id` VARCHAR(191) NOT NULL,`order` INTEGER NOT NULL,UNIQUE INDEX `test_form_sections_test_form_id_order_key`(`test_form_id`,`order`),UNIQUE INDEX `test_form_sections_test_form_id_section_id_key`(`test_form_id`,`section_id`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_sessions` (`id` VARCHAR(191) NOT NULL,`user_id` VARCHAR(191) NOT NULL,`test_form_id` VARCHAR(191) NOT NULL,`status` ENUM('NOT_STARTED','IN_PROGRESS','SECTION_BREAK','SUBMITTED','SCORED','MANUAL_REVIEW') NOT NULL DEFAULT 'NOT_STARTED',`active_section_id` VARCHAR(191) NULL,`section_started_at` DATETIME(3) NULL,`section_ends_at` DATETIME(3) NULL,`started_at` DATETIME(3) NULL,`submitted_at` DATETIME(3) NULL,`integrity_event_count` INTEGER NOT NULL DEFAULT 0,INDEX `test_sessions_user_id_status_idx`(`user_id`,`status`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `session_answers` (`id` VARCHAR(191) NOT NULL,`session_id` VARCHAR(191) NOT NULL,`question_id` VARCHAR(191) NOT NULL,`response_json` JSON NOT NULL,`flagged` BOOLEAN NOT NULL DEFAULT false,`is_correct` BOOLEAN NULL,`points_awarded` DOUBLE NULL,`saved_at` DATETIME(3) NOT NULL,UNIQUE INDEX `session_answers_session_id_question_id_key`(`session_id`,`question_id`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_scores` (`id` VARCHAR(191) NOT NULL,`session_answer_id` VARCHAR(191) NOT NULL,`provider` VARCHAR(191) NOT NULL,`model` VARCHAR(191) NOT NULL,`status` ENUM('PENDING','COMPLETED','FAILED','MANUAL_REVIEW') NOT NULL DEFAULT 'PENDING',`prompt` LONGTEXT NOT NULL,`raw_response` LONGTEXT NULL,`criteria_json` JSON NULL,`overall_band` DOUBLE NULL,`feedback` TEXT NULL,`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),UNIQUE INDEX `ai_scores_session_answer_id_key`(`session_answer_id`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `scores` (`id` VARCHAR(191) NOT NULL,`session_id` VARCHAR(191) NOT NULL,`skill` ENUM('READING','LISTENING','WRITING','SPEAKING','QUANT','VERBAL') NOT NULL,`raw_score` DOUBLE NOT NULL,`max_score` DOUBLE NOT NULL,`scaled_score` DOUBLE NULL,`band` DOUBLE NULL,`computed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),UNIQUE INDEX `scores_session_id_skill_key`(`session_id`,`skill`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ctt_band_tables` (`id` VARCHAR(191) NOT NULL,`exam_code` ENUM('IELTS_AC','IELTS_GT','TOEFL','GRE') NOT NULL,`skill` ENUM('READING','LISTENING','WRITING','SPEAKING','QUANT','VERBAL') NOT NULL,`raw_min` INTEGER NOT NULL,`raw_max` INTEGER NOT NULL,`band` DOUBLE NOT NULL,UNIQUE INDEX `ctt_band_tables_exam_code_skill_raw_min_raw_max_key`(`exam_code`,`skill`,`raw_min`,`raw_max`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `scale_tables` (`id` VARCHAR(191) NOT NULL,`exam_code` ENUM('IELTS_AC','IELTS_GT','TOEFL','GRE') NOT NULL,`skill` ENUM('READING','LISTENING','WRITING','SPEAKING','QUANT','VERBAL') NOT NULL,`raw_min` INTEGER NOT NULL,`raw_max` INTEGER NOT NULL,`scaled_score` DOUBLE NOT NULL,UNIQUE INDEX `scale_tables_exam_code_skill_raw_min_raw_max_key`(`exam_code`,`skill`,`raw_min`,`raw_max`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_log` (`id` VARCHAR(191) NOT NULL,`actor_id` VARCHAR(191) NULL,`action` VARCHAR(191) NOT NULL,`entity` VARCHAR(191) NOT NULL,`entity_id` VARCHAR(191) NOT NULL,`diff_json` JSON NULL,`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),INDEX `audit_log_entity_entity_id_idx`(`entity`,`entity_id`),PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sections` ADD CONSTRAINT `sections_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `passages` ADD CONSTRAINT `passages_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audio_assets` ADD CONSTRAINT `audio_assets_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `question_types` ADD CONSTRAINT `question_types_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `questions` ADD CONSTRAINT `questions_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `questions` ADD CONSTRAINT `questions_passage_id_fkey` FOREIGN KEY (`passage_id`) REFERENCES `passages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `questions` ADD CONSTRAINT `questions_audio_asset_id_fkey` FOREIGN KEY (`audio_asset_id`) REFERENCES `audio_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `questions` ADD CONSTRAINT `questions_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `question_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `answer_keys` ADD CONSTRAINT `answer_keys_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `test_forms` ADD CONSTRAINT `test_forms_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `test_form_sections` ADD CONSTRAINT `test_form_sections_test_form_id_fkey` FOREIGN KEY (`test_form_id`) REFERENCES `test_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `test_form_sections` ADD CONSTRAINT `test_form_sections_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `test_sessions` ADD CONSTRAINT `test_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `test_sessions` ADD CONSTRAINT `test_sessions_test_form_id_fkey` FOREIGN KEY (`test_form_id`) REFERENCES `test_forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `test_sessions` ADD CONSTRAINT `test_sessions_active_section_id_fkey` FOREIGN KEY (`active_section_id`) REFERENCES `sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `session_answers` ADD CONSTRAINT `session_answers_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `session_answers` ADD CONSTRAINT `session_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ai_scores` ADD CONSTRAINT `ai_scores_session_answer_id_fkey` FOREIGN KEY (`session_answer_id`) REFERENCES `session_answers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `scores` ADD CONSTRAINT `scores_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
