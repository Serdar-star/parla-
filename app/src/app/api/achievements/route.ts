import { db } from "@/db";
import { achievements } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const all = await db.select().from(achievements);
    return Response.json({ achievements: all });
  } catch (err) {
    return handleApiError(err);
  }
}
