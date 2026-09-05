"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, GraduationCap, Languages, MessageSquareText, Mic, Send, Sparkles, Wand2, X, Zap } from "lucide-react";
import { Badge, useToast } from "@/components/ui";
import { useApp } from "@/stores/app";
import { postJson } from "@/lib/api";
import { buildChatMessages, groqBrowserChat, loadGroqBridge, type BridgeConfig } from "@/lib/groq-browser";
import { cn, fireConfetti, greeting } from "@/lib/utils";
/* ══════════════════════════════ LUMEN AVATAR ═════════════════════════════ */

type LumenMood = "idle" | "happy" | "thinking" | "listening";

function Lumen({ mood = "idle", size = 56, className }: { mood?: LumenMood; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={cn("select-none", className)} aria-hidden>
      {/* anten */}
      <line x1="50" y1="16" x2="50" y2="6" stroke="#9b5cff" strokeWidth="4" strokeLinecap="round" />
      <motion.circle cx="50" cy="6" r="5" fill="#ffc800" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
      {/* kafa */}
      <rect x="14" y="16" width="72" height="62" rx="26" fill="url(#lumenGrad)" />
      <rect x="14" y="16" width="72" height="62" rx="26" stroke="#6d3fd6" strokeWidth="3" />
      {/* kulaklar */}
      <rect x="6" y="38" width="8" height="18" rx="4" fill="#9b5cff" />
      <rect x="86" y="38" width="8" height="18" rx="4" fill="#9b5cff" />
      {/* gözler */}
      {mood === "thinking" ? (
        <>
          <circle cx="37" cy="42" r="6" fill="#ffffff" />
          <circle cx="63" cy="42" r="6" fill="#ffffff" />
          <circle cx="39" cy="39" r="3" fill="#2b1a52" />
          <circle cx="65" cy="39" r="3" fill="#2b1a52" />
        </>
      ) : mood === "happy" ? (
        <>
          <path d="M30 44 Q37 36 44 44" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M56 44 Q63 36 70 44" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="37" cy="42" r="7.5" fill="#ffffff" />
          <circle cx="63" cy="42" r="7.5" fill="#ffffff" />
          <circle cx="38.5" cy="44" r="3.5" fill="#2b1a52" />
          <circle cx="64.5" cy="44" r="3.5" fill="#2b1a52" />
        </>
      )}
      {/* yanaklar */}
      <circle cx="27" cy="54" r="4" fill="#ff9d9d" opacity="0.7" />
      <circle cx="73" cy="54" r="4" fill="#ff9d9d" opacity="0.7" />
      {/* ağız */}
      {mood === "listening" ? (
        <motion.ellipse cx="50" cy="62" rx="7" ry="5" fill="#2b1a52" animate={{ ry: [4, 7, 4] }} transition={{ duration: 0.7, repeat: Infinity }} />
      ) : mood === "happy" ? (
        <path d="M38 58 Q50 70 62 58" stroke="#2b1a52" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M41 60 Q50 66 59 60" stroke="#2b1a52" strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
      {/* gövde parıltısı */}
      <ellipse cx="32" cy="27" rx="9" ry="5" fill="#c4a3ff" opacity="0.7" transform="rotate(-14 32 27)" />
      <defs>
        <linearGradient id="lumenGrad" x1="14" y1="16" x2="86" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9b5cff" />
          <stop offset="1" stopColor="#5c9dff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ══════════════════════════════ VERİ / MOTOR ═════════════════════════════ */

const modes = [
  { id: "serbest", label: "Serbest Sohbet", icon: MessageSquareText, opener: "Serbest sohbet modu açık! 🎉 Bana gününü anlat, hobilerinden bahset ya da rastgele bir konu aç. Hatalar burada madalya sayılır!" },
  { id: "gramer", label: "Gramer Doktoru", icon: BookOpen, opener: "Gramer kliniği açıldı 🩺 Tense karışıklığı, edatlar, article'lar... Hangi konu başını ağrıtıyor? Sorunu yaz, reçeteyi vereyim." },
  { id: "kelime", label: "Kelime Makinesi", icon: Languages, opener: "Kelime fabrikası çalışıyor! 🏭 Bugünün teması: SEYAHAT. İlk kelimemiz 'journey' (yolculuk). Tahminin ne: 'trip' ile aynı mı, farklı mı?" },
  { id: "ceviri", label: "Çeviri Stüdyosu", icon: Wand2, opener: "Çeviri stüdyosuna hoş geldin 🎬 Türkçe bir cümle yaz, birlikte doğal ve akıcı İngilizcesini inşa edelim. İlk cümle senden!" },
];

const scenarios = [
  { id: "cafe", emoji: "☕", title: "Kafede Sipariş", desc: "Barista Lumen'e sipariş ver", steps: 4 },
  { id: "mulakat", emoji: "💼", title: "İş Görüşmesi", desc: "İK uzmanıyla mülakat pratiği", steps: 5 },
  { id: "restoran", emoji: "🍽️", title: "Restoranda Akşam", desc: "Garsonla menü ve sipariş", steps: 4 },
  { id: "havaalani", emoji: "✈️", title: "Check-in Kontuarı", desc: "Görevliyle bavul işlemleri", steps: 4 },
];

const scenarioOpeners: Record<string, string> = {
  cafe: "🎬 SAHNE: Köşe Kafe, sabah 09:00. Ben barista Lumen, önlüğümü taktım. 'Hello! Welcome to Corner Café. What can I get for you today?' Hadi, siparişinle başla! ☕",
  mulakat: "🎬 SAHNE: Modern bir ofis, saat 14:00. Ben İK uzmanı Ms. Lumen. 'Good afternoon! Thanks for coming in. Tell me a little about yourself.' Kendini tanıt bakalım! 💼",
  restoran: "🎬 SAHNE: Mum ışığında şık bir restoran. Ben garson Lumen, menüyü uzatıyorum. 'Good evening! Here's the menu. Can I start you off with something to drink?' 🍽️",
  havaalani: "🎬 SAHNE: Havalimanı check-in kontuarı. Ben görevli Lumen. 'Good morning! May I see your passport, please? Where are you flying today?' ✈️",
};

const scenarioReplies: Record<string, string[]> = {
  cafe: [
    "Excellent choice! ☕ One more thing — would you like it hot or iced? And any milk preference? (Tam sana göre sorular geliyor!)",
    "Great! 'A latte with oat milk, iced.' Notunu aldım 📝 Last question: anything to eat? Our croissants are fresh out of the oven!",
    "Perfect order! That'll be $6.50. By the way — you speak great English! Where did you learn? 😄 (İltifatı İngilizce karşılamayı dene!)",
    "🎉 Sahne tamamlandı! Siparişin hazır: 'Iced oat latte + croissant.' Bir baristayı bile etkiledin. Sıradaki sahneye geçebilir ya da sohbete devam edebilirsin!",
  ],
  mulakat: [
    "Interesting background! 📋 Now, classic question: 'What is your greatest strength?' Give me one strength and a short example.",
    "Good answer! Let's go deeper: 'Can you describe a challenge you faced and how you solved it?' (Past tense kullanmaya dikkat! 😉)",
    "Impressive! Final question: 'Where do you see yourself in five years?' Hayalini İngilizce anlat, ben not alıyorum ✍️",
    "Any questions for me? Mülakatın sonunda soru sormak puandır! 'What is a typical day like here?' gibi bir şey deneyebilirsin.",
    "🎉 MÜLAKAT TAMAMLANDI! 'You'll hear from us soon' — ama aramızda, seni işe aldım bile. Soru kalıpların çok iyiydi! 💼",
  ],
  restoran: [
    "Sparkling or still water? 💧 And tonight's special is grilled salmon with seasonal vegetables. 'Would you like to hear about our specials?'",
    "Good choice! For the main course, how would you like your steak cooked? Rare, medium, or well-done? 🥩",
    "Excellent! Anything else? 'Would you like to see the dessert menu?' Tiramisumuz meşhurdur, söylemesi benden 😄",
    "🎉 Harika bir akşamdı! Hesabı istemeyi unutma: 'Could we have the bill, please?' kalıbı cebinde kaldı. Şefin selamı var! 🍽️",
  ],
  havaalani: [
    "Thank you! 🛂 How many bags will you be checking in today? 'I have one suitcase to check' gibi söyleyebilirsin.",
    "Perfect. Do you have a seat preference? Window or aisle? 🪟 'I'd like a window seat, please' demeyi dene!",
    "Almost done! 'Would you like to add travel insurance?' ve son soru: 'Do you have any liquids in your carry-on?'",
    "🎉 Check-in tamam! İşte biniş kartın: Gate 23, Boarding 10:40. 'Have a wonderful flight!' — Havalimanı İngilizcesi cebinde! ✈️",
  ],
};

const quizPool = [
  { q: "Hızlı quiz! 'She ___ to the gym every morning.' boşluğa ne gelir?", options: ["go", "goes", "going"], answer: 1, explain: "'She' üçüncü tekil şahıs → fiil -s alır: 'goes' ✅" },
  { q: "Mini test: 'I have lived here ___ 2019.' Hangisi doğru?", options: ["since", "for", "at"], answer: 0, explain: "Belirli bir başlangıç noktası → 'since 2019'. Süre olsaydı 'for' olurdu! ✅" },
  { q: "Bakalım bilecek misin: 'I'm looking forward to ___ you.'", options: ["see", "seeing", "saw"], answer: 1, explain: "'Look forward to' kalıbından sonra -ing gelir: 'seeing' ✅" },
];

interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
  correction?: string;
  quiz?: { q: string; options: string[]; answer: number; explain: string; resolved?: boolean };
  scene?: boolean;
}

function findCorrection(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("i am agree")) return "“I am agree” → “I agree” (agree zaten fiil, 'am' almaz 😉)";
  if (t.includes("i go to beach")) return "“I go to beach” → “I went to the beach” (geçmiş olay + 'the')";
  if (/\bi go (to|at) .* yesterday/.test(t)) return "“I go ... yesterday” → “I went ...” (yesterday geçmiş zaman ister)";
  if (t.includes("more better")) return "“more better” → “better” (better zaten karşılaştırma hâli)";
  if (t.includes("i have went")) return "“I have went” → “I have gone” (gone, went değil!)";
  return undefined;
}

function aiReply(text: string, modeId: string, scenarioId: string | null, turn: number, scenarioTurn: number): Omit<ChatMsg, "id" | "role"> {
  const t = text.toLowerCase();
  const correction = findCorrection(text);

  // senaryo akışı
  if (scenarioId && scenarioReplies[scenarioId]) {
    const replies = scenarioReplies[scenarioId];
    const idx = Math.min(scenarioTurn, replies.length - 1);
    return { text: replies[idx] };
  }

  // gramer doktoru
  if (modeId === "gramer") {
    if (/(perfect|present perfect)/.test(t)) return { text: "Present Perfect'un altın kuralı: geçmişte olmuş ama etkisi ŞİMDİ süren olaylar! 'I have lost my keys' → anahtarlar hâlâ kayıp. Bitmiş ve zamanı belliyse Past Simple: 'I lost my keys yesterday'. Bir örnek kur, kontrol edeyim! 📐" };
    if (/(past|geçmiş)/.test(t)) return { text: "Past Simple = bitmiş, zamanı belli iş. Sihirli kelimeler: yesterday, last week, ago. 'I watched a movie yesterday.' Düzensiz fiiller mi karıştırıyor? En yaygın 10 tanesini ritimle öğretirim: go→went, see→saw, take→took... 🥁" };
    if (/(for|since)/.test(t)) return { text: "İkisi de süre anlatır ama: 'for' + süre (for 3 years), 'since' + başlangıç noktası (since 2021). Kısayol: cümleye 'dır/dir' ekleyebiliyorsan büyük ihtimal Present Perfect + for/since! 🎯" };
    return { text: "Gramer kliniği dinlemede! 🩺 Şu üçlüden hangisi seni zorluyor: tense'ler, edatlar (in/on/at), yoksa article'lar (a/the)? Seç, derine inelim." };
  }

  // kelime makinesi
  if (modeId === "kelime") {
    if (/(journey|trip|aynı)/.test(t)) return { text: "Yaklaştın! 🎯 İnce fark: 'trip' genelde kısa ve gidip dönmeli (business trip), 'journey' uzun ve dönüşümsel hissiyatlı (life journey). Cümle içinde dene: 'The journey to fluency is a long trip through small steps.' Şimdi sıra sende!" };
    if (/(yeni kelime|öğret|başka)/.test(t)) return { text: "Yeni kelime geliyor: 'layover' ✈️ = aktarma bekleme süresi. 'We had a 3-hour layover in Istanbul.' Hafıza çapası: 'lay' (uzan) + 'over' — bekleme salonunda uzanıyorsun! Bir cümle kur da mühürleyelim." };
    return { text: "Seyahat temasında ilerliyoruz 🧳 Bugünün kelimeleri: 'departure' (kalkış), 'layover' (aktarma), 'customs' (gümrük). Hangisini cümlede kullanmak istersin? Seç, birlikte cilalayalım!" };
  }

  // çeviri stüdyosu
  if (modeId === "ceviri") {
    return {
      text: "Harika bir cümle! 🖋️ Stüdyo çevirisi: “I've been learning English for six months and I'm making great progress.” Dikkat: süre devam ediyorsa 'for + Present Perfect' altın ikili. Aynı kalıpla kendi cümleni kur!",
      correction: correction ?? "“six months ago” ≠ “for six months” → devam eden sürede 'for' + Present Perfect",
    };
  }

  // serbest sohbet
  if (/(hi|hello|hey|merhaba|selam)/.test(t)) return { text: "Hello hello! 😊 Enerjin harika. Isınma turu: sabahını 3 cümleyle anlat. Her doğru fiil için sana puan vereceğim — hazır mısın?" };
  if (/(weekend|hafta sonu|tatil)/.test(t)) return { text: "Kulağa harika geliyor! ☕ Detayı sevdim. Küçük bir cila: geçmiş olaylarda 'went/was' ikilisini unutma. Şimdi bana en sevdiğin kısmını tek cümlede anlat!", correction };
  if (/(teşekkür|thanks|thank)/.test(t)) return { text: "You're very welcome! 🌟 Pro ipucu: 'thanks' günlük, 'thank you' nazik, 'I appreciate it' kalpleri eritir. Üçünü de bugün bir yerde kullan, söz mü? 🤝" };
  if (/(yorgun|tired|çalış)/.test(t)) return { text: "Aww, take it easy! 💚 'I'm tired' yerine seviyeni uçuracak alternatifler: 'I'm worn out' (harap), 'I'm drained' (pilim bitti). Hangisi bugünkü ruh hâlin? Bir cümleyle dene!" };

  const followUps = [
    "Bunu sevdim! 🚀 Derine inelim: onu bir sıfat ve bir duygu kelimesiyle anlat. Örnek kalıp: 'It was exciting and I felt proud.' Sıra sende!",
    "Interesting! 🤔 Şimdi 'because' ile bir sebep ekle: '... because it makes me feel free.' Sebep cümleleri konuşmanı olgunlaştırır!",
    "Nice! 👏 Küçük meydan okuma: aynı fikri bu sefer 'used to' kalıbıyla anlat — geçmiş alışkanlıklar için altın anahtar!",
  ];
  return { text: followUps[turn % followUps.length], correction };
}

/* ═════════════════════════════════ SAYFA ═════════════════════════════════ */

export default function AiTeacherPage() {
  const { toast } = useToast();
  const { addGems } = useApp();
  const [mode, setMode] = useState(modes[0]);
  const [scenario, setScenario] = useState<(typeof scenarios)[number] | null>(null);
  const [scenarioTurn, setScenarioTurn] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 1, role: "ai", text: `${greeting()}, Ahmet! Ben Lumen ✨ Senin 7/24 sabırlı öğretmen robotunum. Bir mod seç, senaryoya gir ya da direkt yaz — hatalar burada kutlanır, çünkü öğrenmenin kanıtı onlar! 🎉` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const [scenarioDone, setScenarioDone] = useState<string[]>([]);
  const [aiProvider, setAiProvider] = useState<"groq" | "local" | "checking">("checking");
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const goalRewarded = useRef(false);
  const bridgeRef = useRef<BridgeConfig | null>(null);

  const goalPct = Math.min(100, userTurns * 20);
  const lumenMood: LumenMood = recording ? "listening" : typing ? "thinking" : goalPct >= 100 ? "happy" : "idle";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Groq tarayıcı köprüsünü yükle (sandbox sunucu engelli olsa bile tarayıcı ağı çalışır)
  useEffect(() => {
    let cancelled = false;
    loadGroqBridge(true)
      .then(async (bridge) => {
        if (cancelled) return;
        bridgeRef.current = bridge;
        if (!bridge.enabled || !bridge.apiKey) {
          setAiProvider("local");
          return;
        }
        // Hızlı canlılık testi — tarayıcıdan api.groq.com
        try {
          const test = await groqBrowserChat({
            bridge,
            messages: [
              { role: "system", content: "Reply with exactly: OK" },
              { role: "user", content: "ping" },
            ],
            model: bridge.fastModel || bridge.model,
            maxTokens: 8,
            temperature: 0,
          });
          if (!cancelled) setAiProvider(test.reply ? "groq" : "local");
        } catch {
          if (!cancelled) setAiProvider("local");
        }
      })
      .catch(() => {
        if (!cancelled) setAiProvider("local");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (goalPct >= 100 && !goalRewarded.current) {
      goalRewarded.current = true;
      fireConfetti();
      addGems(10);
      toast("Sohbet hedefi tamamlandı! 🎉", { desc: "+10 elmas + günlük hedefe 2 dk işlendi." });
    }
  }, [goalPct, addGems, toast]);

  const pushAi = (payload: Omit<ChatMsg, "id" | "role">, delay = 1100) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      idRef.current += 1;
      setMessages((m) => [...m, { id: idRef.current, role: "ai", ...payload }]);
    }, delay + Math.random() * 500);
  };

  const send = (custom?: string) => {
    const text = (custom ?? input).trim();
    if (!text || typing) return;
    idRef.current += 1;
    setMessages((m) => [...m, { id: idRef.current, role: "user", text }]);
    setInput("");
    setUserTurns((t) => t + 1);

    if (scenario) {
      // Senaryo sahneleri scriptli akar
      const reply = aiReply(text, mode.id, scenario.id, userTurns, scenarioTurn);
      const newTurn = scenarioTurn + 1;
      setScenarioTurn(newTurn);
      if (newTurn >= scenario.steps && !scenarioDone.includes(scenario.id)) {
        setScenarioDone((d) => [...d, scenario!.id]);
        fireConfetti(true);
        addGems(15);
        toast(`“${scenario.title}” sahnesi tamamlandı! 🎬`, { desc: "+15 elmas + harika bir pratik." });
        setScenario(null);
        setScenarioTurn(0);
      }
      pushAi(reply);
      return;
    }

    // 1) Tarayıcı → Groq (sandbox TLS engelini aşar)
    // 2) Sunucu /api/ai/chat
    // 3) Yerel yedek öğretmen
    setTyping(true);
    (async () => {
      const historyForAi = messages
        .filter((m) => !m.scene && !m.quiz)
        .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("ai" as const), content: m.text }));

      // Browser Groq
      try {
        let bridge = bridgeRef.current;
        if (!bridge) {
          bridge = await loadGroqBridge();
          bridgeRef.current = bridge;
        }
        if (bridge.enabled && bridge.apiKey) {
          const chatMsgs = buildChatMessages(bridge.systemPrompt || "Sen sabırlı bir dil öğretmenisin.", mode.id, historyForAi, text);
          const { reply } = await groqBrowserChat({ bridge, messages: chatMsgs });
          setTyping(false);
          setAiProvider("groq");
          idRef.current += 1;
          setMessages((m) => [...m, { id: idRef.current, role: "ai", text: reply }]);
          return;
        }
      } catch (err) {
        console.warn("Groq browser bridge failed, falling back:", err);
      }

      // Server path
      try {
        const data = await postJson<{ reply: string; provider?: string; usedAI?: boolean }>("/api/ai/chat", {
          message: text,
          mode: mode.id,
        });
        setTyping(false);
        if (data.provider === "groq") setAiProvider("groq");
        idRef.current += 1;
        setMessages((m) => [...m, { id: idRef.current, role: "ai", text: data.reply }]);
        return;
      } catch {
        /* fall through */
      }

      setTyping(false);
      setAiProvider("local");
      const fallback = aiReply(text, mode.id, null, userTurns, 0);
      idRef.current += 1;
      setMessages((m) => [...m, { id: idRef.current, role: "ai", text: fallback.text, correction: fallback.correction }]);
    })();
  };
  const answerQuiz = (msg: ChatMsg, optionIdx: number) => {
    if (!msg.quiz || msg.quiz.resolved) return;
    const ok = optionIdx === msg.quiz.answer;
    setMessages((m) => m.map((x) => (x.id === msg.id && x.quiz ? { ...x, quiz: { ...x.quiz, resolved: true } } : x)));
    idRef.current += 1;
    setMessages((m) => [
      ...m,
      { id: idRef.current, role: "user", text: msg.quiz!.options[optionIdx] },
    ]);
    if (ok) {
      addGems(5);
      fireConfetti();
      pushAi({ text: `✅ Doğru! ${msg.quiz.explain} Bonus olarak +5 elmas kaptın! 💎` }, 700);
    } else {
      pushAi({ text: `Yaklaştın! Doğrusu: “${msg.quiz.options[msg.quiz.answer]}”. ${msg.quiz.explain} Bir dahakine kesin senin! 💪` }, 700);
    }
  };

  const pickMode = (m: (typeof modes)[number]) => {
    setMode(m);
    setScenario(null);
    setScenarioTurn(0);
    idRef.current += 1;
    setMessages((prev) => [...prev, { id: idRef.current, role: "ai", text: m.opener }]);
  };

  const startScenario = (s: (typeof scenarios)[number]) => {
    setScenario(s);
    setScenarioTurn(0);
    idRef.current += 1;
    setMessages((prev) => [...prev, { id: idRef.current, role: "ai", text: scenarioOpeners[s.id], scene: true }]);
  };

  const voiceSend = () => {
    if (recording || typing) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      send("I went to the beach with my family yesterday. We eat fish and I am agree that it was great!");
    }, 2100);
  };

  const suggestions = ["What's the difference between 'make' and 'do'?", "Hafta sonumu anlatayım 🏖️", "Bana 'layover' kelimesini öğret", "I am agree with you!"];

  return (
    <div className="mx-auto grid h-[calc(100vh-7.5rem)] max-w-6xl gap-5 lg:h-[calc(100vh-6rem)] lg:grid-cols-[1fr_290px]">
      {/* ═════════════════════════════ SOHBET KOLONU ═════════════════════════ */}
      <div className="flex min-h-0 flex-col">
        {/* Lumen başlığı */}
        <div className="flex items-center justify-between gap-3 rounded-3xl border-2 border-line bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.6, repeat: Infinity }}>
                <Lumen mood={lumenMood} size={54} />
              </motion.div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-surface bg-primary" />
            </div>
            <div>
              <p className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                Lumen <Badge tone="violet">AI Öğretmen</Badge>
                {aiProvider === "groq" ? (
                  <Badge tone="gold">Groq ●</Badge>
                ) : aiProvider === "checking" ? (
                  <Badge tone="violet">Bağlanıyor…</Badge>
                ) : (
                  <Badge tone="azure">Yerel</Badge>
                )}
              </p>
              <p className="text-xs font-bold text-primary">
                {recording
                  ? "🎙️ Dinliyorum..."
                  : typing
                    ? "✍️ Düşünüyor..."
                    : aiProvider === "groq"
                      ? "● Groq AI aktif · Llama"
                      : aiProvider === "checking"
                        ? "● Groq bağlantısı kontrol ediliyor…"
                        : "● Çevrimiçi · Yerel motor"}
              </p>            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="w-32">
              <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wide text-mut">
                <span>Sohbet hedefi</span>
                <span>{goalPct}%</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full border border-line/60 bg-raise">
                <motion.div animate={{ width: `${goalPct}%` }} className="h-full rounded-full bg-gradient-to-r from-violet to-azure" />
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-xl border-2 border-gold/40 bg-goldsoft px-3 py-1.5 font-display text-sm font-semibold text-gold">
              <Zap className="size-4" /> {userTurns * 2} XP
            </span>
          </div>
        </div>

        {/* modlar */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => pickMode(m)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-display text-sm font-semibold transition-all duration-200",
                mode.id === m.id && !scenario ? "border-transparent bg-violet text-white shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)]" : "border-line bg-surface text-mut shadow-[0_3px_0_var(--line)] hover:text-ink"
              )}
            >
              <m.icon className="size-4.5" /> {m.label}
            </button>
          ))}
        </div>

        {/* mesajlar */}
        <div className="relative mt-3 min-h-0 flex-1 overflow-y-auto rounded-3xl border-2 border-line bg-surface/60 p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-3xl" style={{ background: "radial-gradient(480px 150px at 50% -40px, color-mix(in srgb, var(--violet) 12%, transparent), transparent)" }} />
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                  {m.scene ? (
                    <div className="my-2 flex items-center justify-center">
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="rounded-2xl border-2 border-violet/40 bg-violetsoft px-5 py-3 text-center shadow-card">
                        <p className="text-sm font-bold leading-relaxed text-ink">{m.text}</p>
                      </motion.div>
                    </div>
                  ) : (
                    <div className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                      {m.role === "ai" ? (
                        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-violet/30 bg-violetsoft">
                          <Lumen mood="happy" size={30} />
                        </span>
                      ) : (
                        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-xs font-bold text-primaryink shadow-[0_2px_0_var(--primary-strong)]">AY</span>
                      )}
                      <div className={cn("max-w-[80%]", m.role === "user" && "text-right")}>
                        <div
                          className={cn(
                            "inline-block rounded-2xl px-4 py-3 text-left text-[15px] font-semibold leading-relaxed",
                            m.role === "ai" ? "rounded-tl-md border-2 border-line bg-bg text-ink" : "rounded-tr-md bg-violet text-white shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)]"
                          )}
                        >
                          {m.text}
                        </div>

                        {/* quiz balonu */}
                        {m.quiz && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-2 rounded-2xl border-2 border-gold/40 bg-goldsoft/70 p-4 text-left">
                            <p className="text-sm font-extrabold text-ink">{m.quiz.q}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {m.quiz.options.map((opt, oi) => (
                                <button
                                  key={opt}
                                  disabled={m.quiz!.resolved}
                                  onClick={() => answerQuiz(m, oi)}
                                  className={cn(
                                    "cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all",
                                    !m.quiz!.resolved && "border-line bg-surface text-ink shadow-[0_3px_0_var(--line)] hover:border-gold hover:bg-goldsoft active:translate-y-[3px] active:shadow-none",
                                    m.quiz!.resolved && oi === m.quiz!.answer && "border-primary bg-primarysoft text-primarystrong",
                                    m.quiz!.resolved && oi !== m.quiz!.answer && "border-line bg-surface text-mut opacity-50"
                                  )}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            {m.quiz.resolved && <p className="mt-2 text-xs font-extrabold text-gold">Cevaplandı! Açıklamam birazdan geliyor 👇</p>}
                          </motion.div>
                        )}

                        {m.correction && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-2 rounded-xl border-l-4 border-gold bg-goldsoft px-3.5 py-2.5 text-left">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gold">Mini Düzeltme</p>
                            <p className="mt-0.5 text-sm font-bold text-ink">{m.correction}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-violet/30 bg-violetsoft">
                  <Lumen mood="thinking" size={30} />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border-2 border-line bg-bg px-5 py-4">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }} className="size-2 rounded-full bg-violet" />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* öneriler */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="shrink-0 cursor-pointer rounded-full border-2 border-line bg-surface px-4 py-2 text-xs font-bold text-mut shadow-[0_2px_0_var(--line)] transition hover:border-violet hover:text-violet">
              {s}
            </button>
          ))}
        </div>

        {/* yazma alanı */}
        <div className="relative mt-3">
          <AnimatePresence>
            {recording && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-danger/40 bg-surface px-5 py-3 shadow-pop">
                <div className="flex h-8 items-center gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <motion.span key={i} animate={{ height: [8, 14 + (i % 4) * 6, 8] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.09 }} className="w-1 rounded-full bg-danger" style={{ height: 8 }} />
                  ))}
                </div>
                <p className="text-sm font-extrabold text-danger">Dinliyorum... Konuş Ahmet! 🎙️</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-line bg-surface p-2.5 shadow-card focus-within:border-violet">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={voiceSend}
              className={cn("relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition", recording ? "bg-danger text-white shadow-[0_3px_0_color-mix(in_srgb,var(--danger)_55%,black)]" : "bg-raise text-mut hover:text-ink")}
              aria-label="Sesli mesaj"
            >
              <Mic className="size-5" />
            </motion.button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={recording ? "Dinliyorum... 🎙️" : scenario ? `Sahne aktif: ${scenario.emoji} İngilizce cevap ver!` : "İngilizce yaz, çekinme — hata yapmak serbest!"}
              className="h-11 flex-1 bg-transparent px-2 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-mut/60"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => send()}
              disabled={!input.trim() || typing}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-violet text-white shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)] transition hover:brightness-105 disabled:opacity-40"
              aria-label="Gönder"
            >
              <Send className="size-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ SAĞ PANEL ═══════════════════════════ */}
      <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto pb-2 lg:flex">
        {/* senaryolar */}
        <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <GraduationCap className="size-5 text-violet" /> Senaryo Stüdyosu
          </h2>
          <p className="mt-1 text-xs font-semibold text-mut">Gerçek hayat sahnelerinde rol yap. Her sahne +15 💎</p>
          <div className="mt-3.5 space-y-2.5">
            {scenarios.map((s) => {
              const done = scenarioDone.includes(s.id);
              const activeNow = scenario?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => startScenario(s)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all",
                    activeNow && "border-violet bg-violetsoft shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_40%,var(--line))]",
                    !activeNow && done && "border-primary/40 bg-primarysoft/50",
                    !activeNow && !done && "border-line bg-bg hover:border-violet/50 hover:-translate-y-0.5"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-raise text-xl">{s.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink">{s.title}</span>
                    <span className="block truncate text-[11px] font-bold text-mut">{done ? "✅ Tamamlandı — tekrar oyna" : activeNow ? `Sahne ${scenarioTurn + 1}/${s.steps} oynanıyor...` : s.desc}</span>
                  </span>
                  {activeNow ? (
                    <span className="flex gap-1">
                      {Array.from({ length: s.steps }, (_, i) => (
                        <span key={i} className={cn("size-2 rounded-full", i < scenarioTurn ? "bg-violet" : "bg-linestrong")} />
                      ))}
                    </span>
                  ) : done ? (
                    <Check className="size-4.5 shrink-0 text-primary" />
                  ) : (
                    <Sparkles className="size-4.5 shrink-0 text-violet/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lumen'den ipucu */}
        <div className="rounded-3xl border-2 border-violet/30 bg-violetsoft p-5">
          <div className="flex items-center gap-2.5">
            <Lumen mood="happy" size={40} />
            <p className="font-display text-sm font-semibold text-ink">Lumen'den günlük ipucu</p>
          </div>
          <p className="mt-2.5 text-xs font-semibold leading-relaxed text-ink/80">
            🎯 Bugünün kalıbı: <span className="rounded-md bg-white/70 px-1.5 py-0.5 font-extrabold">“I'm looking forward to + -ing”</span> — gelecekteki bir şey için heyecan anlatır. Örnek: “I'm looking forward to practising with you!” Hemen bir cümlede dene!
          </p>
        </div>

        {/* sohbet istatistikleri */}
        <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
          <h2 className="font-display text-sm font-semibold text-ink">Bugünün sohbet karnesi</h2>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-bg px-3.5 py-2.5">
              <span className="text-xs font-bold text-mut">Mesaj sayın</span>
              <span className="font-display text-sm font-bold text-ink">{userTurns}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-bg px-3.5 py-2.5">
              <span className="text-xs font-bold text-mut">Sohbet süresi</span>
              <span className="font-display text-sm font-bold text-ink">{userTurns * 2} dk</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-bg px-3.5 py-2.5">
              <span className="text-xs font-bold text-mut">Biten sahneler</span>
              <span className="font-display text-sm font-bold text-ink">{scenarioDone.length}/{scenarios.length} 🎬</span>
            </div>
          </div>
          {scenario && (
            <button onClick={() => { setScenario(null); setScenarioTurn(0); toast("Sahneden çıkıldı", { desc: "Serbest sohbete döndün.", type: "info" }); }} className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-line bg-bg py-2 text-xs font-extrabold text-mut transition hover:text-danger">
              <X className="size-3.5" /> Sahneyi bitir
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
