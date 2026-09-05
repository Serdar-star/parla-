import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues, userLanguages, userSettings, users } from "@/db/schema";
import { weekStartStr } from "@/lib/rules";

export const COOKIE_NAME = "parla-token";
const JWT_SECRET = process.env.JWT_SECRET || "parla-fallback-secret";

/**
 * DEMO MODE — preview'da login sürtünmesini tamamen kaldırır.
 *
 * `DEMO_MODE=off` env ile kapatılıp gerçek login akışına geri dönülür
 * (auth kodu aynen duruyor, sadece bu bayrakla atlanıyor).
 * Varsayılan AÇIK: çerez/iframe sorunu yüzünden giriş yapamayan kullanıcı
 * uygulamayı hiç login olmadan, hazır bir hesapla açar.
 */
export const DEMO_MODE = (process.env.DEMO_MODE ?? "on") !== "off";

function secret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function signToken(userId: number) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number) {
  const token = await signToken(userId);
  const production = process.env.NODE_ENV === "production";
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Preview, siteler arası bir iframe içinde sunuluyor (arena.ai -> e2b.app).
    // Tarayıcılar SameSite=Lax çerezleri üçüncü taraf (cross-site) bağlamda
    // GÖNDERMİYOR; bu yüzden login sonrası /dashboard isteği çerezsiz gidip
    // middleware'den /login'e dönüyordu. iframe gömme için None+Secure şart.
    // Partitioned (CHIPS) Safari'nin üçüncü taraf çerez engelinde de çalışır.
    sameSite: production ? "none" : "lax",
    secure: production,
    partitioned: production,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const production = process.env.NODE_ENV === "production";
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: production ? "none" : "lax",
    secure: production,
    partitioned: production,
  });
}

export type DbUser = typeof users.$inferSelect;

export function publicUser(u: DbUser) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    nativeLanguage: u.nativeLanguage,
    currentLanguage: u.currentLanguage,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    longestStreak: u.longestStreak,
    dailyGoal: u.dailyGoal,
    streakFreeze: u.streakFreeze,
    coins: u.coins,
    isPremium: u.isPremium,
    gamesPlayed: u.gamesPlayed,
    bossKills: u.bossKills,
    createdAt: u.createdAt,
  };
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    const id = await verifyToken(token);
    if (id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (rows[0]) return rows[0];
    }
  }
  // DEMO MODE: geçerli oturum yoksa uygulamayı hazır hesapla aç.
  // Gerçek token her zaman önceliklidir (DEMO_MODE=off ile tamamen kapanır).
  if (DEMO_MODE) return getOrCreateDemoUser();
  return null;
}

/** Demo hesabı: kayıtlı ilk kullanıcıyı kullanır; tablo boşsa minimal hesap üretir. */
async function getOrCreateDemoUser(): Promise<DbUser> {
  const first = await db.select().from(users).orderBy(asc(users.id)).limit(1);
  if (first[0]) return first[0];

  const rows = await db
    .insert(users)
    .values({
      email: "demo@parla.app",
      username: "demo",
      fullName: "Demo Kullanıcı",
      passwordHash: bcrypt.hashSync("demo1234", 10),
    })
    .returning();
  const u = rows[0];
  await db.insert(userLanguages).values({ userId: u.id, languageCode: "en", cefrLevel: "A1" });
  await db.insert(leagues).values({ userId: u.id, leagueType: "altin", weeklyXp: 0, rank: 0, weekStart: weekStartStr() });
  await db.insert(userSettings).values({ userId: u.id });
  return u;
}

/** Auth gerektiren route'larda kullan — yoksa 401 hatası fırlatır. */
export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }
  return user;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("API hatası:", err);
  return Response.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
}
