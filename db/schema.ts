import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = integer("created_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`);

export const members = sqliteTable(
  "members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    displayName: text("display_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    position: text("position", {
      enum: ["VOCAL", "GUITAR", "BASS", "DRUMS", "KEYBOARD"],
    }).notNull(),
    pinHash: text("pin_hash"),
    role: text("role", { enum: ["MEMBER", "ADMIN", "OWNER"] })
      .notNull()
      .default("MEMBER"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    pinFailedCount: integer("pin_failed_count").notNull().default(0),
    pinLockedUntil: integer("pin_locked_until", { mode: "timestamp_ms" }),
    createdAt,
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("members_normalized_name_unique").on(table.normalizedName),
    check(
      "members_position_check",
      sql`${table.position} in ('VOCAL', 'GUITAR', 'BASS', 'DRUMS', 'KEYBOARD')`,
    ),
    check(
      "members_role_check",
      sql`${table.role} in ('MEMBER', 'ADMIN', 'OWNER')`,
    ),
    check("members_pin_failed_count_check", sql`${table.pinFailedCount} >= 0`),
  ],
);

export const memberInvites = sqliteTable(
  "member_invites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    purpose: text("purpose", { enum: ["INITIAL_PIN", "PIN_RESET"] })
      .notNull()
      .default("INITIAL_PIN"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdByMemberId: integer("created_by_member_id").references(
      () => members.id,
      { onDelete: "set null" },
    ),
    createdAt,
  },
  (table) => [
    uniqueIndex("member_invites_token_hash_unique").on(table.tokenHash),
    index("member_invites_member_id_idx").on(table.memberId),
    check(
      "member_invites_purpose_check",
      sql`${table.purpose} in ('INITIAL_PIN', 'PIN_RESET')`,
    ),
  ],
);

export const adminCredentials = sqliteTable(
  "admin_credentials",
  {
    memberId: integer("member_id")
      .primaryKey()
      .references(() => members.id, { onDelete: "cascade" }),
    passwordHash: text("password_hash").notNull(),
    failedCount: integer("failed_count").notNull().default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    check("admin_credentials_failed_count_check", sql`${table.failedCount} >= 0`),
  ],
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    assurance: text("assurance", { enum: ["MEMBER", "ADMIN"] })
      .notNull()
      .default("MEMBER"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdAt,
  },
  (table) => [
    uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
    index("auth_sessions_member_id_idx").on(table.memberId),
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
    check(
      "auth_sessions_assurance_check",
      sql`${table.assurance} in ('MEMBER', 'ADMIN')`,
    ),
  ],
);

export const monthlyRounds = sqliteTable(
  "monthly_rounds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    revision: integer("revision").notNull().default(1),
    status: text("status", { enum: ["nominating", "voting", "closed"] })
      .notNull()
      .default("nominating"),
    nominationDeadline: integer("nomination_deadline", {
      mode: "timestamp_ms",
    }).notNull(),
    votingDeadline: integer("voting_deadline", { mode: "timestamp_ms" }).notNull(),
    heroTitle: text("hero_title").notNull(),
    heroDescription: text("hero_description"),
    selectedSongId: integer("selected_song_id"),
    closedAt: integer("closed_at", { mode: "timestamp_ms" }),
    invalidatedAt: integer("invalidated_at", { mode: "timestamp_ms" }),
    invalidatedByMemberId: integer("invalidated_by_member_id").references(
      () => members.id,
      { onDelete: "set null" },
    ),
    createdAt,
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("monthly_rounds_period_revision_unique").on(
      table.year,
      table.month,
      table.revision,
    ),
    index("monthly_rounds_status_idx").on(table.status),
    check("monthly_rounds_month_check", sql`${table.month} between 1 and 12`),
    check("monthly_rounds_year_check", sql`${table.year} >= 2020`),
    check("monthly_rounds_revision_check", sql`${table.revision} >= 1`),
    check(
      "monthly_rounds_status_check",
      sql`${table.status} in ('nominating', 'voting', 'closed')`,
    ),
    check(
      "monthly_rounds_deadline_order_check",
      sql`${table.nominationDeadline} <= ${table.votingDeadline}`,
    ),
  ],
);

export const roundMembers = sqliteTable(
  "round_members",
  {
    roundId: integer("round_id")
      .notNull()
      .references(() => monthlyRounds.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.roundId, table.memberId] }),
    index("round_members_member_id_idx").on(table.memberId),
  ],
);

export const songs = sqliteTable(
  "songs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roundId: integer("round_id")
      .notNull()
      .references(() => monthlyRounds.id, { onDelete: "cascade" }),
    artist: text("artist").notNull(),
    title: text("title").notNull(),
    songType: text("song_type", { enum: ["MALE", "FEMALE"] }).notNull(),
    url: text("url"),
    note: text("note"),
    createdByMemberId: integer("created_by_member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    createdAt,
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("songs_round_id_idx").on(table.roundId),
    index("songs_created_by_member_id_idx").on(table.createdByMemberId),
    check("songs_artist_length_check", sql`length(${table.artist}) between 1 and 80`),
    check("songs_title_length_check", sql`length(${table.title}) between 1 and 120`),
    check("songs_type_check", sql`${table.songType} in ('MALE', 'FEMALE')`),
  ],
);

export const votes = sqliteTable(
  "votes",
  {
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    value: text("value", { enum: ["like", "dislike"] }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.memberId] }),
    index("votes_member_id_idx").on(table.memberId),
    check("votes_value_check", sql`${table.value} in ('like', 'dislike')`),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorMemberId: integer("actor_member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt,
  },
  (table) => [
    index("audit_logs_actor_member_id_idx").on(table.actorMemberId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
