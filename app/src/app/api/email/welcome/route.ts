import { handleApiError, requireUser } from "@/lib/auth";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  lang: z.string().optional(),
  level: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    const email = parsed.success && parsed.data.email ? parsed.data.email : user.email;
    const name = parsed.success && parsed.data.name ? parsed.data.name : user.fullName;
    const lang = parsed.success && parsed.data.lang ? parsed.data.lang : user.currentLanguage || "en";
    const level = parsed.success && parsed.data.level ? parsed.data.level : "A1";

    const ok = await sendEmail(email, "Parla'ya Hoş Geldin! 🎉", welcomeEmailHtml(name, lang, level));
    return Response.json({ ok, sent: ok });
  } catch (err) {
    return handleApiError(err);
  }
}
