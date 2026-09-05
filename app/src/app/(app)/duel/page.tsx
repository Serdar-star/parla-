"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Swords, Trophy, Zap } from "lucide-react";
import { Avatar, Badge, Button, Card, ProgressBar, useToast } from "@/components/ui";
import { getJson, postJson, putJson } from "@/lib/api";
import { cn, fireConfetti } from "@/lib/utils";

type Friend = { id: number; fullName: string; username: string; level: number; weeklyXp?: number; streak?: number };
type DuelQ = { id: number; question: string; options: string[]; correct: number };
type HistoryItem = {
  id: number;
  status: string;
  challengerScore: number;
  opponentScore: number;
  isWinner: boolean;
  opponent: { id: number; fullName: string; username: string } | null;
  finishedAt?: string | null;
};

export default function DuelPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"play" | "history">("play");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, total: 0 });
  const [duelId, setDuelId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<DuelQ[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [phase, setPhase] = useState<"idle" | "playing" | "result">("idle");
  const [lastResult, setLastResult] = useState<{ won: boolean; my: number; opp: number } | null>(null);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [opponentName, setOpponentName] = useState("Rakip");

  const load = useCallback(async () => {
    try {
      const f = await getJson<{ friends: Friend[] }>("/api/friends");
      setFriends(f.friends || []);
    } catch {}
    try {
      const h = await getJson<{ duels: HistoryItem[]; stats: typeof stats }>("/api/duel/history");
      setHistory(h.duels || []);
      setStats(h.stats || { wins: 0, losses: 0, total: 0 });
    } catch {}
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (phase !== "playing" || answered) return;
    if (timeLeft <= 0) {
      void submitAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, answered, qIndex]);

  const challenge = async (friend: Friend) => {
    setLoading(true);
    setOpponentName(friend.fullName);
    try {
      const data = await postJson<{ duel: any }>("/api/duel/challenge", { opponentId: friend.id });
      // Auto-accept for demo flow so user can play immediately
      try {
        await putJson(`/api/duel/${data.duel.id}/accept`, { action: "accept" });
      } catch {}
      const qs: DuelQ[] = (data.duel.questionsJson as DuelQ[]) || [];
      // Better questions from vocab style
      const better = qs.map((q, i) => ({
        ...q,
        question: [
          "Book kelimesinin Türkçe karşılığı nedir?",
          "Apple ne demek?",
          "I ___ to school yesterday. (go)",
          "She ___ English every day. (study)",
          "Beautiful eş anlamlısı?",
          "Present Perfect: I ___ finished. (have/has)",
          "Cat çoğulu nedir?",
          "How ___ are you? (old/much)",
          "Water Türkçesi nedir?",
          "Past of see?",
        ][i] || q.question,
        options: [
          ["Kitap", "Defter", "Kalem", "Masa"],
          ["Elma", "Armut", "Muz", "Üzüm"],
          ["go", "went", "gone", "going"],
          ["study", "studies", "studied", "studying"],
          ["pretty", "ugly", "fast", "slow"],
          ["have", "has", "had", "having"],
          ["cats", "cates", "caties", "cat"],
          ["old", "much", "many", "long"],
          ["Su", "Ateş", "Toprak", "Hava"],
          ["saw", "seed", "seen", "sees"],
        ][i] || q.options,
        correct: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0][i] ?? 0,
      }));
      setDuelId(data.duel.id);
      setQuestions(better);
      setQIndex(0);
      setMyScore(0);
      setOppScore(0);
      setTimeLeft(15);
      setStartedAt(Date.now());
      setPhase("playing");
      setAnswered(false);
      setSelected(null);
      toast("Düello başladı! ⚔️", { desc: `${friend.fullName} ile 10 soru` });
    } catch (e: any) {
      toast(e?.message || "Düello başlatılamadı", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (optIdx: number) => {
    if (answered || phase !== "playing") return;
    setAnswered(true);
    setSelected(optIdx);
    const q = questions[qIndex];
    const timeTaken = Math.min(15, Math.round((Date.now() - startedAt) / 1000));
    const isCorrect = optIdx === q.correct;
    let points = 0;
    if (isCorrect) {
      if (timeTaken <= 5) points = 100;
      else if (timeTaken <= 10) points = 75;
      else points = 50;
    }
    // Simulated opponent
    const oppCorrect = Math.random() > 0.35;
    const oppTime = 3 + Math.floor(Math.random() * 10);
    let oppPts = 0;
    if (oppCorrect) {
      if (oppTime <= 5) oppPts = 100;
      else if (oppTime <= 10) oppPts = 75;
      else oppPts = 50;
    }

    setMyScore((s) => s + points);
    setOppScore((s) => s + oppPts);

    if (duelId) {
      try {
        await postJson(`/api/duel/${duelId}/answer`, {
          questionIndex: qIndex,
          answer: String(optIdx),
          timeTaken,
        });
      } catch {}
    }

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        const finalMy = myScore + points;
        const finalOpp = oppScore + oppPts;
        const won = finalMy >= finalOpp;
        setLastResult({ won, my: finalMy, opp: finalOpp });
        setPhase("result");
        if (won) fireConfetti(true);
        void load();
      } else {
        setQIndex((i) => i + 1);
        setTimeLeft(15);
        setStartedAt(Date.now());
        setAnswered(false);
        setSelected(null);
      }
    }, 900);
  };

  if (phase === "result" && lastResult) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-[2.5rem] border-2 border-line bg-surface p-8 shadow-pop">
          <p className="text-6xl">{lastResult.won ? "🎉" : "😔"}</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">{lastResult.won ? "Kazandın!" : "Kaybettin"}</h1>
          <p className="mt-2 text-sm font-semibold text-mut">{lastResult.won ? "+50 XP" : "+20 XP"} · {opponentName}</p>
          <div className="mt-6 flex items-center justify-center gap-8">
            <div>
              <p className="font-display text-4xl font-bold text-primary">{lastResult.my}</p>
              <p className="text-xs font-extrabold uppercase text-mut">Sen</p>
            </div>
            <span className="font-display text-xl font-bold text-danger">VS</span>
            <div>
              <p className="font-display text-4xl font-bold text-danger">{lastResult.opp}</p>
              <p className="text-xs font-extrabold uppercase text-mut">Rakip</p>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" full onClick={() => setPhase("idle")}>
              Ana Sayfa
            </Button>
            <Button full onClick={() => setPhase("idle")}>
              Tekrar Oyna
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "playing" && questions[qIndex]) {
    const q = questions[qIndex];
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between rounded-3xl border-2 border-line bg-surface p-4">
          <div className="text-center">
            <Avatar name="Sen" hue={150} size={48} />
            <p className="mt-1 font-display text-lg font-bold text-primary">{myScore}</p>
          </div>
          <div className="text-center">
            <p className="font-display text-sm font-bold text-mut">
              {qIndex + 1}/10
            </p>
            <div className={cn("mx-auto mt-1 flex size-14 items-center justify-center rounded-full border-2 font-display text-xl font-bold", timeLeft <= 5 ? "border-danger text-danger" : "border-line text-ink")}>
              {timeLeft}
            </div>
          </div>
          <div className="text-center">
            <Avatar name={opponentName} hue={340} size={48} />
            <p className="mt-1 font-display text-lg font-bold text-danger">{oppScore}</p>
          </div>
        </div>
        <ProgressBar value={((qIndex + 1) / 10) * 100} className="mt-3" />
        <Card className="mt-4 p-6">
          <p className="font-display text-xl font-bold text-ink">{q.question}</p>
          <div className="mt-5 grid gap-3">
            {q.options.map((opt, i) => {
              const show = answered;
              const isCorrect = i === q.correct;
              const isSel = selected === i;
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => void submitAnswer(i)}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-extrabold transition-all",
                    !show && "border-line bg-bg hover:border-primary",
                    show && isCorrect && "border-primary bg-primarysoft text-primarystrong",
                    show && isSel && !isCorrect && "border-danger bg-dangersoft text-danger",
                    show && !isSel && !isCorrect && "border-line bg-bg opacity-50"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-danger text-white shadow-[0_3px_0_color-mix(in_srgb,var(--danger)_55%,black)]">
            <Swords className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Düello Arenası</h1>
            <p className="text-sm font-semibold text-mut">
              {stats.wins}W · {stats.losses}L · {stats.total} maç
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["play", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-extrabold uppercase", tab === t ? "border-danger bg-dangersoft text-danger" : "border-line bg-surface text-mut")}>
              {t === "play" ? "Oyna" : "Geçmiş"}
            </button>
          ))}
        </div>
      </div>

      {tab === "play" ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-mut">Arkadaşlarından rakip seç ve meydan oku:</p>
          {friends.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-4xl">👥</p>
              <p className="mt-3 font-display text-lg font-bold text-ink">Henüz arkadaşın yok</p>
              <p className="mt-1 text-sm font-semibold text-mut">Arkadaşlar sayfasından ekle, sonra düello yap!</p>
              <Button className="mt-4" href="/friends">
                Arkadaşlara Git
              </Button>
            </Card>
          ) : (
            friends.map((f) => (
              <Card key={f.id} className="flex items-center gap-4 p-4">
                <Avatar name={f.fullName} hue={(f.id * 40) % 360} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-ink">{f.fullName}</p>
                  <p className="text-xs font-bold text-mut">
                    Sv. {f.level} · @{f.username}
                  </p>
                </div>
                <Button size="sm" variant="danger" loading={loading} onClick={() => void challenge(f)}>
                  <Zap className="size-3.5" /> Meydan Oku
                </Button>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {history.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="mx-auto size-10 text-gold" />
              <p className="mt-3 font-display text-lg font-bold text-ink">Henüz düello yok</p>
            </Card>
          ) : (
            history.map((d) => (
              <Card key={d.id} className="flex items-center gap-4 p-4">
                <span className="text-2xl">{d.status === "finished" ? (d.isWinner ? "🏆" : "⚔️") : "⏳"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-ink">vs {d.opponent?.fullName || "Rakip"}</p>
                  <p className="text-xs font-bold text-mut">
                    {d.challengerScore} - {d.opponentScore} · {d.status}
                  </p>
                </div>
                {d.status === "finished" && <Badge tone={d.isWinner ? "primary" : "danger"}>{d.isWinner ? "Galibiyet" : "Mağlubiyet"}</Badge>}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
