CREATE TABLE `admin_credentials` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "admin_credentials_failed_count_check" CHECK("admin_credentials"."failed_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_member_id` integer,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_member_id_idx` ON `audit_logs` (`actor_member_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`assurance` text DEFAULT 'MEMBER' NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "auth_sessions_assurance_check" CHECK("auth_sessions"."assurance" in ('MEMBER', 'ADMIN'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_hash_unique` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_sessions_member_id_idx` ON `auth_sessions` (`member_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_at_idx` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `member_invites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`purpose` text DEFAULT 'INITIAL_PIN' NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_by_member_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "member_invites_purpose_check" CHECK("member_invites"."purpose" in ('INITIAL_PIN', 'PIN_RESET'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_invites_token_hash_unique` ON `member_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `member_invites_member_id_idx` ON `member_invites` (`member_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`position` text NOT NULL,
	`pin_hash` text,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`pin_failed_count` integer DEFAULT 0 NOT NULL,
	`pin_locked_until` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "members_position_check" CHECK("members"."position" in ('VOCAL', 'GUITAR', 'BASS', 'DRUMS', 'KEYBOARD')),
	CONSTRAINT "members_role_check" CHECK("members"."role" in ('MEMBER', 'ADMIN', 'OWNER')),
	CONSTRAINT "members_pin_failed_count_check" CHECK("members"."pin_failed_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_normalized_name_unique` ON `members` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `monthly_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'nominating' NOT NULL,
	`nomination_deadline` integer NOT NULL,
	`voting_deadline` integer NOT NULL,
	`hero_title` text NOT NULL,
	`hero_description` text,
	`selected_song_id` integer,
	`closed_at` integer,
	`invalidated_at` integer,
	`invalidated_by_member_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`invalidated_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "monthly_rounds_month_check" CHECK("monthly_rounds"."month" between 1 and 12),
	CONSTRAINT "monthly_rounds_year_check" CHECK("monthly_rounds"."year" >= 2020),
	CONSTRAINT "monthly_rounds_revision_check" CHECK("monthly_rounds"."revision" >= 1),
	CONSTRAINT "monthly_rounds_status_check" CHECK("monthly_rounds"."status" in ('nominating', 'voting', 'closed')),
	CONSTRAINT "monthly_rounds_deadline_order_check" CHECK("monthly_rounds"."nomination_deadline" <= "monthly_rounds"."voting_deadline")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_rounds_period_revision_unique` ON `monthly_rounds` (`year`,`month`,`revision`);--> statement-breakpoint
CREATE INDEX `monthly_rounds_status_idx` ON `monthly_rounds` (`status`);--> statement-breakpoint
CREATE TABLE `round_members` (
	`round_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`joined_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`round_id`, `member_id`),
	FOREIGN KEY (`round_id`) REFERENCES `monthly_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `round_members_member_id_idx` ON `round_members` (`member_id`);--> statement-breakpoint
CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`round_id` integer NOT NULL,
	`artist` text NOT NULL,
	`title` text NOT NULL,
	`song_type` text NOT NULL,
	`url` text,
	`note` text,
	`created_by_member_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `monthly_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "songs_artist_length_check" CHECK(length("songs"."artist") between 1 and 80),
	CONSTRAINT "songs_title_length_check" CHECK(length("songs"."title") between 1 and 120),
	CONSTRAINT "songs_type_check" CHECK("songs"."song_type" in ('MALE', 'FEMALE'))
);
--> statement-breakpoint
CREATE INDEX `songs_round_id_idx` ON `songs` (`round_id`);--> statement-breakpoint
CREATE INDEX `songs_created_by_member_id_idx` ON `songs` (`created_by_member_id`);--> statement-breakpoint
CREATE TABLE `votes` (
	`song_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`song_id`, `member_id`),
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "votes_value_check" CHECK("votes"."value" in ('like', 'dislike'))
);
--> statement-breakpoint
CREATE INDEX `votes_member_id_idx` ON `votes` (`member_id`);