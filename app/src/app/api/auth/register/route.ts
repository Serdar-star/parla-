import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { leagues, userLanguages, userSettings, users } from "@/db/schema";
import { ApiError, handleApiError, publicUser, setSessionCookie } from "@/lib/auth";
import { weekStartStr } from "@/lib/rules";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { fullName?: string; username?: string; email?: string; password?: string };
    const fullName = body.fullName?.trim();
    const username = body.username?.trim().toLowerCase();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!fullName || fullName.length < 3) throw new ApiError(400, "Ad soyad en az 3 karakter olmalı.");
    if (!username || username.length < 3) throw new ApiError(400, "Kullanıcı adı en az 3 karakter olmalı.");
    if (!/^\S+@\S+\.\S+$/.test(email ?? "")) throw new ApiError(400, "Geçerli bir e-posta adresi gir.");
    if (password.length < 6) throw new ApiError(400, "Şifre en az 6 karakter olmalı.");

    const existing = await db.select({ id: users.id }).from(users).where(or(eq(users.email, email!), eq(users.username, username!))).limit(1);
    if (existing.length > 0) throw new ApiError(409, "Bu e-posta veya kullanıcı adı zaten kayıtlı.");

    const rows = await db
      .insert(users)
      .values({
        email: email!,
        username: username!,
        fullName,
        passwordHash: bcrypt.hashSync(password, 10),
      })
      .returning();
    const user = rows[0];

    await db.insert(userLanguages).values({ userId: user.id, languageCode: "en", cefrLevel: "A1" });
    await db.insert(leagues).values({ userId: user.id, leagueType: "altin", weeklyXp: 0, rank: 0, weekStart: weekStartStr() });
    await db.insert(userSettings).values({ userId: user.id });

    await setSessionCookie(user.id);
    return Response.json({ user: publicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
