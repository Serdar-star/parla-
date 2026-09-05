import { z } from "zod";

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  mode: z.string().optional().default("serbest"),
});

export const roleplaySchema = z.object({
  character: z.string().min(1),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

export const roleplayFinishSchema = z.object({
  character: z.string(),
  transcript: z.array(z.object({ role: z.string(), content: z.string() })),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(2000),
  style: z.enum(["resmi", "gunluk", "argo"]).optional().default("gunluk"),
  targetLang: z.string().optional().default("en"),
});

export const correctSchema = z.object({
  text: z.string().min(1).max(2000),
  targetLang: z.string().optional().default("en"),
});

export const visionSchema = z.object({
  image: z.string().min(10),
  targetLang: z.string().optional().default("en"),
});

export const friendRequestSchema = z.object({
  friendId: z.number().int().positive(),
});

export const friendSearchSchema = z.object({
  q: z.string().min(1).max(100),
});

export const duelChallengeSchema = z.object({
  opponentId: z.number().int().positive(),
});

export const duelAnswerSchema = z.object({
  questionIndex: z.number().int().min(0),
  answer: z.string().min(1).max(500),
  timeTaken: z.number().int().min(0).max(20),
});

export const notificationTypeSchema = z.enum([
  "streak_reminder",
  "achievement",
  "level_up",
  "duel_invite",
  "duel_result",
  "friend_request",
  "weekly_report",
  "daily_goal",
]);

export const paymentCheckoutSchema = z.object({
  plan: z.enum(["premium", "pro"]),
  billing: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

export const emailSchema = z.object({
  email: z.string().email(),
  type: z.string().optional(),
});

export const adminUserUpdateSchema = z.object({
  isPremium: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  subscriptionPlan: z.string().optional(),
  level: z.number().int().min(1).max(100).optional(),
  xp: z.number().int().min(0).optional(),
});

export const lessonCreateSchema = z.object({
  languageCode: z.string().min(2).max(5).default("en"),
  cefrLevel: z.string().min(1).max(5).default("A1"),
  unitNumber: z.number().int().min(1),
  lessonNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional().default(""),
  type: z.string().optional().default("ders"),
  xpReward: z.number().int().min(0).max(500).optional().default(20),
  estimatedMinutes: z.number().int().min(1).max(120).optional().default(7),
  content: z.any(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const res = schema.safeParse(data);
  if (!res.success) {
    return { ok: false, error: res.error.issues.map((i) => i.message).join(", ") };
  }
  return { ok: true, data: res.data };
}
