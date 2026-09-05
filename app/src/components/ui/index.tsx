"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { cn, formatNumber, initials } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "soft" | "outline" | "ghost" | "danger" | "gold" | "azure" | "dark";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
  full?: boolean;
}

const variantCls: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primaryink shadow-[0_5px_0_var(--primary-strong)] hover:brightness-105",
  soft: "bg-primarysoft text-primarystrong shadow-[0_5px_0_color-mix(in_srgb,var(--primary-strong)_30%,var(--line))] hover:brightness-[1.02]",
  outline: "border-2 border-line bg-surface text-ink shadow-[0_5px_0_var(--line)] hover:text-primary",
  ghost: "text-mut hover:text-ink hover:bg-raise/70",
  danger: "bg-danger text-white shadow-[0_5px_0_color-mix(in_srgb,var(--danger)_55%,black)] hover:brightness-105",
  gold: "bg-gold text-[#4a3800] shadow-[0_5px_0_color-mix(in_srgb,var(--gold)_55%,black)] hover:brightness-105",
  azure: "bg-azure text-white shadow-[0_5px_0_color-mix(in_srgb,var(--azure)_55%,black)] hover:brightness-105",
  dark: "bg-ink text-bg shadow-[0_5px_0_rgba(0,0,0,.45)] hover:opacity-90",
};

const sizeCls: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
  xl: "h-[3.9rem] px-9 text-lg rounded-2xl gap-3",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  href,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const cls = cn(
    "inline-flex items-center justify-center font-display font-semibold tracking-tight select-none transition-all duration-100 active:translate-y-[5px] active:shadow-none cursor-pointer whitespace-nowrap uppercase",
    variantCls[variant],
    sizeCls[size],
    full && "w-full",
    (disabled || loading) && "opacity-50 pointer-events-none",
    className
  );
  const inner = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
  hover,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-3xl border-2 border-line bg-surface shadow-card",
        hover && "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-linestrong hover:shadow-[0_6px_0_var(--line-strong)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Input ---------------------------------- */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: ReactNode;
}

export function Input({ label, error, success, icon, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-extrabold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mut">{icon}</span>}
        <input
          id={inputId}
          className={cn(
            "h-13 w-full rounded-2xl border-2 bg-surface px-4 text-[15px] font-semibold text-ink outline-none transition-all duration-200 placeholder:font-medium placeholder:text-mut/60",
            icon && "pl-11",
            error
              ? "border-danger focus:border-danger focus:shadow-[0_0_0_4px_var(--danger-soft)]"
              : success
                ? "border-primary focus:border-primary focus:shadow-[0_0_0_4px_var(--primary-soft)]"
                : "border-line focus:border-primary focus:shadow-[0_0_0_4px_var(--primary-soft)]",
            className
          )}
          {...rest}
        />
        {error && <XCircle className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-danger" />}
        {success && !error && <CheckCircle2 className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-primary" />}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs font-bold text-danger">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({ children, tone = "primary", className }: { children: ReactNode; tone?: "primary" | "gold" | "accent" | "violet" | "azure" | "mut" | "danger"; className?: string }) {
  const tones = {
    primary: "bg-primarysoft text-primarystrong",
    gold: "bg-goldsoft text-gold",
    accent: "bg-accentsoft text-accent",
    violet: "bg-violetsoft text-violet",
    azure: "bg-azuresoft text-azure",
    mut: "bg-raise text-mut",
    danger: "bg-dangersoft text-danger",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

/* --------------------------------- StatChip -------------------------------- */

export function StatChip({ icon, value, onClick, className, title }: { icon: ReactNode; value: ReactNode; onClick?: () => void; className?: string; title?: string }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-xl border-2 border-line bg-surface px-3 font-display text-sm font-semibold text-ink shadow-[0_3px_0_var(--line)]",
        onClick && "cursor-pointer transition-all hover:-translate-y-0.5 hover:border-linestrong active:translate-y-[2px] active:shadow-none",
        className
      )}
    >
      {icon}
      {value}
    </Tag>
  );
}

/* -------------------------------- Progress --------------------------------- */

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-3.5 w-full overflow-hidden rounded-full bg-raise border border-line/60", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative h-full rounded-full bg-gradient-to-b from-[#7ce83c] to-primary", barClassName)}
      >
        <div className="absolute inset-x-2 top-[3px] h-[5px] rounded-full bg-white/30" />
      </motion.div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 110,
  stroke = 11,
  children,
  color = "var(--primary)",
  track = "var(--raise)",
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  color?: string;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * v) / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* --------------------------------- Counter --------------------------------- */

export function Counter({ to, duration = 1.5, decimals = 0, suffix = "", className }: { to: number; duration?: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const controls = animate(0, to, { duration, ease: "easeOut", onUpdate: (v) => setVal(v) });
          return () => controls.stop();
        }
      },
      { threshold: 0.35 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(val, decimals)}
      {suffix}
    </span>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

/* ---------------------------------- Toggle --------------------------------- */

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("relative h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200", checked ? "border-primarystrong bg-primary" : "border-linestrong bg-raise")}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-[3px] size-5.5 rounded-full bg-white shadow-sm", checked ? "left-[26px]" : "left-[3px]")} />
    </button>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({ name, hue = 150, size = 40, className }: { name: string; hue?: number; size?: number; className?: string }) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white border-2 border-black/10", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${hue + 40} 72% 40%))`,
      }}
    >
      {initials(name)}
    </div>
  );
}

/* --------------------------------- StarRow --------------------------------- */

export function StarRow({ count, total = 5, size = 16 }: { count: number; total?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < count ? "var(--gold)" : "var(--raise)"} stroke={i < count ? "none" : "var(--line-strong)"} strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-ink/45 backdrop-blur-sm dark:bg-black/65" />
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn("relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border-2 border-line bg-surface shadow-pop", className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------- Toasts --------------------------------- */

type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  type: ToastType;
}

const ToastCtx = createContext<{ toast: (title: string, opts?: { desc?: string; type?: ToastType }) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

const toastMeta: Record<ToastType, { icon: ReactNode; cls: string }> = {
  success: { icon: <CheckCircle2 className="size-5 text-primary" />, cls: "border-primary/40" },
  error: { icon: <XCircle className="size-5 text-danger" />, cls: "border-danger/40" },
  info: { icon: <Info className="size-5 text-azure" />, cls: "border-azure/40" },
  warning: { icon: <AlertTriangle className="size-5 text-gold" />, cls: "border-gold/50" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((title: string, opts?: { desc?: string; type?: ToastType }) => {
    const id = ++idRef.current;
    setItems((p) => [...p.slice(-3), { id, title, desc: opts?.desc, type: opts?.type ?? "success" }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 90) setItems((p) => p.filter((x) => x.id !== t.id));
              }}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 90, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn("pointer-events-auto flex items-start gap-3 rounded-2xl border-2 bg-surface p-3.5 shadow-pop", toastMeta[t.type].cls)}
            >
              {toastMeta[t.type].icon}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ink">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-xs font-semibold text-mut">{t.desc}</p>}
              </div>
              <button onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} className="cursor-pointer rounded-md p-0.5 text-mut transition hover:text-ink">
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------ Section heading ---------------------------- */

export function SectionHeading({ eyebrow, title, desc, className }: { eyebrow: string; title: string; desc?: string; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("mx-auto max-w-2xl text-center", className)}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-surface px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary shadow-[0_3px_0_var(--line)]">
        {eyebrow}
      </span>
      <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.1]">{title}</h2>
      {desc && <p className="mt-4 text-base font-semibold leading-relaxed text-mut">{desc}</p>}
    </motion.div>
  );
}
