import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handleApiError, publicUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) throw new ApiError(400, "E-posta ve şifre gerekli.");

    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new ApiError(401, "E-posta veya şifre hatalı.");
    }

    await setSessionCookie(user.id);
    return Response.json({ user: publicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
