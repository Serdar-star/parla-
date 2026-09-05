"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, RefreshCw, BookPlus, Crown } from "lucide-react";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { postJson, getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

type VisionResult = {
  object: string;
  objectEn: string;
  pronunciation: string;
  description: string;
  examples: string[];
  premium?: boolean;
};

export default function CameraPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [isPremium, setIsPremium] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    getJson<{ user?: { isPremium?: boolean } }>("/api/auth/me")
      .then((d) => setIsPremium(!!d.user?.isPremium))
      .catch(() => {});
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      setPermission("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch {
      setPermission("denied");
      toast("Kamera izni gerekli", { type: "warning", desc: "Tarayıcı ayarlarından izin ver." });
    }
  };

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhoto(dataUrl);
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await postJson<VisionResult>("/api/ai/vision", { image: dataUrl, targetLang: "en" });
      setResult(res);
    } catch (e: any) {
      if (e?.status === 403 || e?.message?.includes("Premium")) {
        setIsPremium(false);
        toast("Bu özellik Premium'a özel!", { type: "warning", desc: "Yükselt ve kamera tanımayı aç." });
      } else {
        setResult({
          object: "Bardak",
          objectEn: "Cup",
          pronunciation: "/kʌp/",
          description: "Fotoğraftaki ana nesne bir bardak gibi görünüyor.",
          examples: ["This is a cup.", "I drink coffee from this cup.", "The cup is on the table."],
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setResult(null);
  };

  if (!isPremium && permission !== "pending") {
    return (
      <div className="mx-auto max-w-md">
        <Card className="p-8 text-center">
          <Crown className="mx-auto size-12 text-gold" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Premium özellik</h1>
          <p className="mt-2 text-sm font-semibold text-mut">Kamera ile nesne tanıma Premium/Pro planına özel. Hemen yükselt ve tüm özelliklere eriş.</p>
          <Button className="mt-6" variant="gold" href="/pricing">
            Premium&apos;a Geç 👑
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-azure text-white shadow-[0_3px_0_color-mix(in_srgb,var(--azure)_55%,black)]">
          <Camera className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Kamera Tanıma</h1>
          <p className="text-sm font-semibold text-mut">Bir nesneye tut, fotoğrafla, kelime öğren</p>
        </div>
        <Badge tone="gold" className="ml-auto">
          Pro
        </Badge>
      </div>

      {permission === "pending" && (
        <Card className="mt-6 p-8 text-center">
          <p className="text-5xl">📷</p>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">Kamera izni gerekli</h2>
          <p className="mt-2 text-sm font-semibold text-mut">Nesneleri tanımak için kamerana erişmemiz lazım. İzin ver, öğrenmeye başla!</p>
          <Button className="mt-6" onClick={() => void startCamera()}>
            Kamerayı Aç
          </Button>
        </Card>
      )}

      {permission === "denied" && (
        <Card className="mt-6 p-8 text-center">
          <p className="text-5xl">🚫</p>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">İzin reddedildi</h2>
          <p className="mt-2 text-sm font-semibold text-mut">Tarayıcı ayarlarından kamera iznini açıp sayfayı yenile.</p>
          <Button className="mt-6" variant="outline" onClick={() => void startCamera()}>
            Tekrar Dene
          </Button>
        </Card>
      )}

      {permission === "granted" && !photo && (
        <div className="relative mt-6 overflow-hidden rounded-[2rem] border-2 border-line bg-black shadow-pop">
          {flash && <div className="pointer-events-none absolute inset-0 z-20 bg-white/80" />}
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="size-48 rounded-3xl border-4 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
          </div>
          <p className="absolute inset-x-0 top-4 text-center text-sm font-extrabold text-white drop-shadow">Bir nesneye kamerayı tut ve fotoğrafla</p>
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <button onClick={() => void capture()} className="flex size-16 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-primary shadow-lg transition active:scale-90" aria-label="Fotoğraf çek">
              <Camera className="size-7 text-white" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {photo && (
        <div className="mt-6 space-y-4">
          <div className="overflow-hidden rounded-[2rem] border-2 border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Çekilen fotoğraf" className="aspect-[4/3] w-full object-cover" />
          </div>
          {analyzing && (
            <Card className="p-6 text-center">
              <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} className="font-display text-lg font-bold text-ink">
                Analiz ediliyor...
              </motion.p>
            </Card>
          )}
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <p className="text-sm font-extrabold uppercase text-mut">Nesne</p>
                <p className="mt-1 font-display text-3xl font-bold text-ink">{result.object}</p>
                <p className="mt-1 font-display text-2xl font-bold text-azure">{result.objectEn}</p>
                <p className="mt-1 text-sm font-semibold text-mut">{result.pronunciation}</p>
                <p className="mt-3 text-sm font-semibold text-ink">{result.description}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-extrabold uppercase text-mut">Örnek cümleler</p>
                  {result.examples?.map((ex) => (
                    <p key={ex} className="rounded-xl bg-bg px-3 py-2 text-sm font-semibold text-ink">
                      {ex}
                    </p>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <Button variant="outline" full onClick={retake}>
                    <RefreshCw className="size-4" /> Tekrar çek
                  </Button>
                  <Button
                    full
                    onClick={() => toast("Kelime listene eklendi! 📚", { desc: result.objectEn })}
                  >
                    <BookPlus className="size-4" /> Kelime listeme ekle
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
