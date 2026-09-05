import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/* SQLite/libSQL (Turso) şeması — sütun adları önceki PG şemasıyla aynıdır. */

/* ═══════════════════════════════ USERS ═══════════════════════════════ */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    nativeLanguage: text("native_language").notNull().default("tr"),
    currentLanguage: text("current_language").notNull().default("en"),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    streak: integer("streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActivity: text("last_activity"),
    dailyGoal: integer("daily_goal").notNull().default(10),
    streakFreeze: integer("streak_freeze").notNull().default(1),
    coins: integer("coins").notNull().default(0),
    isPremium: integer("is_premium", { mode: "boolean" }).notNull().default(false),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    premiumExpiresAt: integer("premium_expires_at", { mode: "timestamp" }),
    subscriptionPlan: text("subscription_plan").notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    gamesPlayed: integer("games_played").notNull().default(0),
    bossKills: integer("boss_kills").notNull().default(0),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ emailIdx: index("users_email_idx").on(t.email) })
);

export const usersRelations = relations(users, ({ many }) => ({
  languages: many(userLanguages),
  lessons: many(userLessons),
  vocabulary: many(userVocabulary),
  achievements: many(userAchievements),
  activity: many(dailyActivity),
  leagues: many(leagues),
  conversations: many(aiConversations),
}));

/* ═══════════════════════════ USER_LANGUAGES ══════════════════════════ */
export const userLanguages = sqliteTable(
  "user_languages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: text("language_code").notNull(),
    cefrLevel: text("cefr_level").notNull().default("A1"),
    totalXp: integer("total_xp").notNull().default(0),
    wordsLearned: integer("words_learned").notNull().default(0),
    lessonsCompleted: integer("lessons_completed").notNull().default(0),
    currentUnit: integer("current_unit").notNull().default(1),
    currentLesson: integer("current_lesson").notNull().default(1),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ userLangIdx: uniqueIndex("user_lang_idx").on(t.userId, t.languageCode) })
);

/* ═══════════════════════════════ LESSONS ═════════════════════════════ */
export const lessons = sqliteTable(
  "lessons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    languageCode: text("language_code").notNull().default("en"),
    cefrLevel: text("cefr_level").notNull().default("A1"),
    unitNumber: integer("unit_number").notNull(),
    lessonNumber: integer("lesson_number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: text("type").notNull().default("ders"),
    xpReward: integer("xp_reward").notNull().default(20),
    estimatedMinutes: integer("estimated_minutes").notNull().default(7),
    content: text("content", { mode: "json" }).notNull().$type<unknown>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ lessonPathIdx: uniqueIndex("lesson_path_idx").on(t.languageCode, t.unitNumber, t.lessonNumber) })
);

export const lessonsRelations = relations(lessons, ({ many }) => ({
  userLessons: many(userLessons),
}));

/* ═══════════════════════════ USER_LESSONS ════════════════════════════ */
export const userLessons = sqliteTable(
  "user_lessons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    score: integer("score").notNull().default(0),
    xpEarned: integer("xp_earned").notNull().default(0),
    mistakes: integer("mistakes").notNull().default(0),
    timeSpent: integer("time_spent").notNull().default(0),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (t) => ({ userLessonIdx: uniqueIndex("user_lesson_idx").on(t.userId, t.lessonId) })
);

export const userLessonsRelations = relations(userLessons, ({ one }) => ({
  lesson: one(lessons, { fields: [userLessons.lessonId], references: [lessons.id] }),
}));

/* ═══════════════════════════ VOCABULARY ══════════════════════════════ */
export const vocabulary = sqliteTable(
  "vocabulary",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    languageCode: text("language_code").notNull().default("en"),
    word: text("word").notNull(),
    translation: text("translation").notNull(),
    pronunciation: text("pronunciation").notNull().default(""),
    exampleSentence: text("example_sentence").notNull().default(""),
    exampleTranslation: text("example_translation").notNull().default(""),
    imageEmoji: text("image_emoji").notNull().default("📖"),
    category: text("category").notNull().default("Genel"),
    cefrLevel: text("cefr_level").notNull().default("A1"),
    difficulty: integer("difficulty").notNull().default(1),
  },
  (t) => ({ wordIdx: uniqueIndex("vocab_word_idx").on(t.languageCode, t.word) })
);

/* ═══════════════════════════ USER_VOCABULARY ═════════════════════════ */
export const userVocabulary = sqliteTable(
  "user_vocabulary",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vocabularyId: integer("vocabulary_id")
      .notNull()
      .references(() => vocabulary.id, { onDelete: "cascade" }),
    strength: integer("strength").notNull().default(0),
    timesReviewed: integer("times_reviewed").notNull().default(0),
    timesCorrect: integer("times_correct").notNull().default(0),
    nextReview: integer("next_review", { mode: "timestamp" }).notNull().defaultNow(),
    lastReviewed: integer("last_reviewed", { mode: "timestamp" }),
  },
  (t) => ({ userVocabIdx: uniqueIndex("user_vocab_idx").on(t.userId, t.vocabularyId), reviewIdx: index("review_idx").on(t.userId, t.nextReview) })
);

/* ═══════════════════════════ ACHIEVEMENTS ════════════════════════════ */
export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  requirementType: text("requirement_type").notNull(),
  requirementValue: integer("requirement_value").notNull().default(1),
  xpReward: integer("xp_reward").notNull().default(0),
  coinReward: integer("coin_reward").notNull().default(0),
});

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    earnedAt: integer("earned_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ userAchIdx: uniqueIndex("user_ach_idx").on(t.userId, t.achievementId) })
);

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

/* ═══════════════════════════ DAILY_ACTIVITY ══════════════════════════ */
export const dailyActivity = sqliteTable(
  "daily_activity",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    xpEarned: integer("xp_earned").notNull().default(0),
    minutesSpent: integer("minutes_spent").notNull().default(0),
    lessonsCompleted: integer("lessons_completed").notNull().default(0),
    wordsReviewed: integer("words_reviewed").notNull().default(0),
  },
  (t) => ({ dayIdx: uniqueIndex("daily_activity_idx").on(t.userId, t.date) })
);

/* ═══════════════════════════════ LEAGUES ═════════════════════════════ */
export const leagues = sqliteTable(
  "leagues",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leagueType: text("league_type").notNull().default("bronz"),
    weeklyXp: integer("weekly_xp").notNull().default(0),
    rank: integer("rank").notNull().default(0),
    weekStart: text("week_start").notNull(),
  },
  (t) => ({ weekIdx: uniqueIndex("league_week_idx").on(t.userId, t.weekStart), rankIdx: index("league_rank_idx").on(t.weekStart, t.weeklyXp) })
);

/* ═══════════════════════════ AI_CONVERSATIONS ════════════════════════ */
export const aiConversations = sqliteTable(
  "ai_conversations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: text("language_code").notNull().default("en"),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ convIdx: index("conv_user_idx").on(t.userId, t.createdAt) })
);

/* ═══════════════════════════ FRIENDSHIPS ═════════════════════════════ */
export const friendships = sqliteTable(
  "friendships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: integer("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("accepted"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ friendIdx: uniqueIndex("friendship_idx").on(t.userId, t.friendId) })
);

/* ═══════════════════════════ DAILY TASKS ═════════════════════════════ */
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  icon: text("icon").notNull().default("📚"),
  xp: integer("xp").notNull().default(10),
});

export const userTasks = sqliteTable(
  "user_tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  },
  (t) => ({ userTaskIdx: uniqueIndex("user_task_idx").on(t.userId, t.taskId, t.date) })
);

/* ═══════════════════════════ FAVORİLER ═════════════════════════════ */
export const favorites = sqliteTable(
  "favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vocabularyId: integer("vocabulary_id")
      .notNull()
      .references(() => vocabulary.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({ favIdx: uniqueIndex("fav_idx").on(t.userId, t.vocabularyId) })
);

/* ═══════════════════════════ USER SETTINGS ═══════════════════════════ */
export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  theme: text("theme").notNull().default("system"),
  soundEffects: integer("sound_effects", { mode: "boolean" }).notNull().default(true),
  micPermission: integer("mic_permission", { mode: "boolean" }).notNull().default(true),
  animations: integer("animations", { mode: "boolean" }).notNull().default(true),
  notifTime: text("notif_time").notNull().default("19:30"),
  notifLesson: integer("notif_lesson", { mode: "boolean" }).notNull().default(true),
  notifStreak: integer("notif_streak", { mode: "boolean" }).notNull().default(true),
  notifLeague: integer("notif_league", { mode: "boolean" }).notNull().default(false),
});

/* ═══════════════════════════ NOTIFICATIONS ═══════════════════════════ */
export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    data: text("data", { mode: "json" }).$type<Record<string, unknown> | null>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
    readIdx: index("notifications_read_idx").on(t.userId, t.isRead),
  })
);

/* ═══════════════════════════ DUELS ═══════════════════════════════════ */
export const duels = sqliteTable(
  "duels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    challengerId: integer("challenger_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opponentId: integer("opponent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    winnerId: integer("winner_id").references(() => users.id, { onDelete: "set null" }),
    challengerScore: integer("challenger_score").notNull().default(0),
    opponentScore: integer("opponent_score").notNull().default(0),
    currentQuestion: integer("current_question").notNull().default(0),
    questionsJson: text("questions_json", { mode: "json" }).$type<unknown[]>().notNull().default([]),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({
    challengerIdx: index("duels_challenger_idx").on(t.challengerId),
    opponentIdx: index("duels_opponent_idx").on(t.opponentId),
    statusIdx: index("duels_status_idx").on(t.status),
  })
);

export const duelAnswers = sqliteTable(
  "duel_answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    duelId: integer("duel_id")
      .notNull()
      .references(() => duels.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionIndex: integer("question_index").notNull(),
    answer: text("answer").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
    timeTaken: integer("time_taken").notNull().default(0),
    pointsEarned: integer("points_earned").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({
    duelIdx: index("duel_answers_duel_idx").on(t.duelId),
    userDuelIdx: uniqueIndex("duel_answers_user_q_idx").on(t.duelId, t.userId, t.questionIndex),
  })
);

/* ═══════════════════════════ PUSH SUBSCRIPTIONS ══════════════════════ */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({
    userEndpointIdx: uniqueIndex("push_user_endpoint_idx").on(t.userId, t.endpoint),
  })
);

/* ═══════════════════════════ SONGS ════════════════════════════════════ */
export const songs = sqliteTable("songs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  language: text("language").notNull().default("en"),
  lyricsJson: text("lyrics_json", { mode: "json" }).$type<{ line: string; tr: string; words: { word: string; meaning: string }[] }[]>().notNull(),
  difficulty: text("difficulty").notNull().default("A2"),
  genre: text("genre").notNull().default("pop"),
  emoji: text("emoji").notNull().default("🎵"),
  youtubeId: text("youtube_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

/* ═══════════════════════════ PODCASTS ═════════════════════════════════ */
export const podcasts = sqliteTable("podcasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  language: text("language").notNull().default("en"),
  duration: integer("duration").notNull().default(300),
  transcriptJson: text("transcript_json", { mode: "json" }).$type<{ time: number; text: string; tr: string }[]>().notNull(),
  difficulty: text("difficulty").notNull().default("A2"),
  category: text("category").notNull().default("general"),
  emoji: text("emoji").notNull().default("🎙️"),
  questionsJson: text("questions_json", { mode: "json" }).$type<{ q: string; options: string[]; answer: number }[]>().notNull().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

/* ═══════════════════════════ NEWS ARTICLES ════════════════════════════ */
export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  language: text("language").notNull().default("en"),
  simpleContent: text("simple_content").notNull(),
  mediumContent: text("medium_content").notNull(),
  originalContent: text("original_content").notNull(),
  category: text("category").notNull().default("world"),
  emoji: text("emoji").notNull().default("📰"),
  readingTime: integer("reading_time").notNull().default(3),
  difficulty: text("difficulty").notNull().default("A2"),
  questionsJson: text("questions_json", { mode: "json" }).$type<{ q: string; options: string[]; answer: number }[]>().notNull().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

/* ═══════════════════════════ PAYMENTS ═════════════════════════════════ */
export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripePaymentId: text("stripe_payment_id").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("usd"),
    plan: text("plan").notNull().default("premium"),
    status: text("status").notNull().default("succeeded"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("payments_user_idx").on(t.userId),
  })
);
