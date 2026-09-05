import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(10),
  auth: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const existing = await db.select().from(pushSubscriptions).where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, parsed.data.endpoint))).limit(1);
    if (existing[0]) return Response.json({ ok: true, subscription: existing[0] });

    const inserted = await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
    }).returning();

    return Response.json({ ok: true, subscription: inserted[0] });
  } catch (err) {
    return handleApiError(err);
  }
}
