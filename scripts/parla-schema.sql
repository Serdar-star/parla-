CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`category` text NOT NULL,
	`requirement_type` text NOT NULL,
	`requirement_value` integer DEFAULT 1 NOT NULL,
	`xp_reward` integer DEFAULT 0 NOT NULL,
	`coin_reward` integer DEFAULT 0 NOT NULL
);

CREATE TABLE `ai_conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`language_code` text DEFAULT 'en' NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `daily_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`xp_earned` integer DEFAULT 0 NOT NULL,
	`minutes_spent` integer DEFAULT 0 NOT NULL,
	`lessons_completed` integer DEFAULT 0 NOT NULL,
	`words_reviewed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `duel_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`duel_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`question_index` integer NOT NULL,
	`answer` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	`time_taken` integer DEFAULT 0 NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`duel_id`) REFERENCES `duels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `duels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`challenger_id` integer NOT NULL,
	`opponent_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`winner_id` integer,
	`challenger_score` integer DEFAULT 0 NOT NULL,
	`opponent_score` integer DEFAULT 0 NOT NULL,
	`current_question` integer DEFAULT 0 NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`challenger_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opponent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`vocabulary_id` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `friendships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`friend_id` integer NOT NULL,
	`status` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `leagues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`league_type` text DEFAULT 'bronz' NOT NULL,
	`weekly_xp` integer DEFAULT 0 NOT NULL,
	`rank` integer DEFAULT 0 NOT NULL,
	`week_start` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`language_code` text DEFAULT 'en' NOT NULL,
	`cefr_level` text DEFAULT 'A1' NOT NULL,
	`unit_number` integer NOT NULL,
	`lesson_number` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'ders' NOT NULL,
	`xp_reward` integer DEFAULT 20 NOT NULL,
	`estimated_minutes` integer DEFAULT 7 NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);

CREATE TABLE `news_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`simple_content` text NOT NULL,
	`medium_content` text NOT NULL,
	`original_content` text NOT NULL,
	`category` text DEFAULT 'world' NOT NULL,
	`emoji` text DEFAULT '📰' NOT NULL,
	`reading_time` integer DEFAULT 3 NOT NULL,
	`difficulty` text DEFAULT 'A2' NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);

CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`data` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`stripe_payment_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`plan` text DEFAULT 'premium' NOT NULL,
	`status` text DEFAULT 'succeeded' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `podcasts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`duration` integer DEFAULT 300 NOT NULL,
	`transcript_json` text NOT NULL,
	`difficulty` text DEFAULT 'A2' NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`emoji` text DEFAULT '🎙️' NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);

CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`lyrics_json` text NOT NULL,
	`difficulty` text DEFAULT 'A2' NOT NULL,
	`genre` text DEFAULT 'pop' NOT NULL,
	`emoji` text DEFAULT '🎵' NOT NULL,
	`youtube_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);

CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`icon` text DEFAULT '📚' NOT NULL,
	`xp` integer DEFAULT 10 NOT NULL
);

CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`achievement_id` integer NOT NULL,
	`earned_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `user_languages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`language_code` text NOT NULL,
	`cefr_level` text DEFAULT 'A1' NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`words_learned` integer DEFAULT 0 NOT NULL,
	`lessons_completed` integer DEFAULT 0 NOT NULL,
	`current_unit` integer DEFAULT 1 NOT NULL,
	`current_lesson` integer DEFAULT 1 NOT NULL,
	`started_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `user_lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`lesson_id` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`xp_earned` integer DEFAULT 0 NOT NULL,
	`mistakes` integer DEFAULT 0 NOT NULL,
	`time_spent` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`sound_effects` integer DEFAULT true NOT NULL,
	`mic_permission` integer DEFAULT true NOT NULL,
	`animations` integer DEFAULT true NOT NULL,
	`notif_time` text DEFAULT '19:30' NOT NULL,
	`notif_lesson` integer DEFAULT true NOT NULL,
	`notif_streak` integer DEFAULT true NOT NULL,
	`notif_league` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `user_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`task_id` integer NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `user_vocabulary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`vocabulary_id` integer NOT NULL,
	`strength` integer DEFAULT 0 NOT NULL,
	`times_reviewed` integer DEFAULT 0 NOT NULL,
	`times_correct` integer DEFAULT 0 NOT NULL,
	`next_review` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_reviewed` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`full_name` text NOT NULL,
	`avatar_url` text,
	`native_language` text DEFAULT 'tr' NOT NULL,
	`current_language` text DEFAULT 'en' NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_activity` text,
	`daily_goal` integer DEFAULT 10 NOT NULL,
	`streak_freeze` integer DEFAULT 1 NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`is_premium` integer DEFAULT false NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`premium_expires_at` integer,
	`subscription_plan` text DEFAULT 'free' NOT NULL,
	`stripe_customer_id` text,
	`games_played` integer DEFAULT 0 NOT NULL,
	`boss_kills` integer DEFAULT 0 NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);

CREATE TABLE `vocabulary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`language_code` text DEFAULT 'en' NOT NULL,
	`word` text NOT NULL,
	`translation` text NOT NULL,
	`pronunciation` text DEFAULT '' NOT NULL,
	`example_sentence` text DEFAULT '' NOT NULL,
	`example_translation` text DEFAULT '' NOT NULL,
	`image_emoji` text DEFAULT '📖' NOT NULL,
	`category` text DEFAULT 'Genel' NOT NULL,
	`cefr_level` text DEFAULT 'A1' NOT NULL,
	`difficulty` integer DEFAULT 1 NOT NULL
);

CREATE INDEX `conv_user_idx` ON `ai_conversations` (`user_id`,`created_at`);
CREATE UNIQUE INDEX `daily_activity_idx` ON `daily_activity` (`user_id`,`date`);
CREATE INDEX `duel_answers_duel_idx` ON `duel_answers` (`duel_id`);
CREATE UNIQUE INDEX `duel_answers_user_q_idx` ON `duel_answers` (`duel_id`,`user_id`,`question_index`);
CREATE INDEX `duels_challenger_idx` ON `duels` (`challenger_id`);
CREATE INDEX `duels_opponent_idx` ON `duels` (`opponent_id`);
CREATE INDEX `duels_status_idx` ON `duels` (`status`);
CREATE UNIQUE INDEX `fav_idx` ON `favorites` (`user_id`,`vocabulary_id`);
CREATE UNIQUE INDEX `friendship_idx` ON `friendships` (`user_id`,`friend_id`);
CREATE UNIQUE INDEX `league_week_idx` ON `leagues` (`user_id`,`week_start`);
CREATE INDEX `league_rank_idx` ON `leagues` (`week_start`,`weekly_xp`);
CREATE UNIQUE INDEX `lesson_path_idx` ON `lessons` (`language_code`,`unit_number`,`lesson_number`);
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);
CREATE INDEX `notifications_read_idx` ON `notifications` (`user_id`,`is_read`);
CREATE INDEX `payments_user_idx` ON `payments` (`user_id`);
CREATE UNIQUE INDEX `push_user_endpoint_idx` ON `push_subscriptions` (`user_id`,`endpoint`);
CREATE UNIQUE INDEX `user_ach_idx` ON `user_achievements` (`user_id`,`achievement_id`);
CREATE UNIQUE INDEX `user_lang_idx` ON `user_languages` (`user_id`,`language_code`);
CREATE UNIQUE INDEX `user_lesson_idx` ON `user_lessons` (`user_id`,`lesson_id`);
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);
CREATE UNIQUE INDEX `user_task_idx` ON `user_tasks` (`user_id`,`task_id`,`date`);
CREATE UNIQUE INDEX `user_vocab_idx` ON `user_vocabulary` (`user_id`,`vocabulary_id`);
CREATE INDEX `review_idx` ON `user_vocabulary` (`user_id`,`next_review`);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
CREATE INDEX `users_email_idx` ON `users` (`email`);
CREATE UNIQUE INDEX `vocab_word_idx` ON `vocabulary` (`language_code`,`word`);
