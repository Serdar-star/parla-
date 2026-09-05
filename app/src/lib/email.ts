import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
let resendClient: Resend | null = null;

export function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (resendClient) return resendClient;
  resendClient = new Resend(RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[Email mock] To: ${to}, Subject: ${subject}`);
    return true;
  }
  try {
    await client.emails.send({
      from: "Parla <noreply@parla.app>",
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
    console.error("Email send failed", e);
    return false;
  }
}

export function welcomeEmailHtml(name: string, lang: string, level: string): string {
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #7c3aed; font-size: 28px;">Parla'ya Hoş Geldin, ${name}! 🎉</h1>
    <p>Harika bir karar verdin! ${lang} dilinde ${level} seviyesinden başlıyorsun.</p>
    <h3>Nasıl Çalışır?</h3>
    <ul>
      <li>📚 Her gün 10 dakika ders yap</li>
      <li>🔥 Serini koru, rozetler kazan</li>
      <li>🤖 AI öğretmenin Lumen ile pratik yap</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">İlk Dersi Başlat 🚀</a>
  </div>`;
}

export function streakEmailHtml(name: string, streak: number): string {
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #f59e0b;">Serini kaybetmek üzeresin! 🔥</h1>
    <p>Merhaba ${name},</p>
    <p><strong>${streak} günlük</strong> serini kaybetmek üzeresin! 2 gündür ders yapmadın.</p>
    <p>Serini korumak için hemen bir ders yap!</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/lessons" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Hemen Derse Başla ⚡</a>
  </div>`;
}

export function weeklyEmailHtml(name: string, stats: { xp: number; lessons: number; streak: number }): string {
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #7c3aed;">Haftalık Raporun Hazır! 📊</h1>
    <p>Merhaba ${name}, bu hafta harika iş çıkardın!</p>
    <ul>
      <li>⚡ ${stats.xp} XP kazandın</li>
      <li>📚 ${stats.lessons} ders tamamladın</li>
      <li>🔥 ${stats.streak} günlük seri</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/report" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Rapora Bak</a>
  </div>`;
}

export function duelInviteEmailHtml(name: string, challenger: string): string {
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Düelloya Davet Edildin! ⚔️</h1>
    <p>${challenger} seni düelloya davet etti!</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/duel" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Kabul Et</a>
  </div>`;
}

export function levelUpEmailHtml(name: string, level: number): string {
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Seviye Atladın! ⭐ Seviye ${level}</h1>
    <p>Tebrikler ${name}! Yeni seviyeye ulaştın.</p>
    <p>Yeni özellikler açıldı, keşfetmeye devam et!</p>
  </div>`;
}
