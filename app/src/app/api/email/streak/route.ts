import { handleApiError, requireUser } from "@/lib/auth";
import { sendEmail, streakEmailHtml } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  streak: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    const email = parsed.success && parsed.data.email ? parsed.data.email : user.email;
    const name = parsed.success && parsed.data.name ? parsed.data.name : user.fullName;
    const streak = parsed.success && parsed.data.streak != null ? parsed.data.streak : user.streak;

    const ok = await sendEmail(email, "Serini kaybetmek üzeresin! 🔥", streakEmailHtml(name, streak));
    return Response.json({ ok });
  } catch (err) {
    return handleApiError(err);
  }
}
