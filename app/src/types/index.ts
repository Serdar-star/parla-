export type LessonStatus = "completed" | "active" | "locked";

export type LessonKind = "ders" | "dinleme" | "konuşma" | "hikaye" | "boss";

export interface LessonNode {
  id: string;
  title: string;
  kind: LessonKind;
  xp: number;
  duration: string;
  stars: number;
  status: LessonStatus;
}

export interface Unit {
  id: string;
  no: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  lessons: LessonNode[];
}

export interface VocabWord {
  en: string;
  tr: string;
  emoji: string;
  category: string;
  phonetic: string;
  pos: string;
  example: string;
  exampleTr: string;
  synonyms: string[];
  antonyms: string[];
}

export type Question =
  | { type: "sec"; prompt: string; word: VocabWord; options: string[] }
  | { type: "eslestir"; pairs: { left: string; right: string }[] }
  | { type: "sirala"; prompt: string; answer: string[]; bank: string[] }
  | { type: "dinle"; word: VocabWord; options: string[] }
  | { type: "konuş"; word: VocabWord }
  | { type: "bosluk"; sentence: [string, string]; answer: string; options: string[] }
  | { type: "resim"; prompt: string; answer: VocabWord; options: VocabWord[] };

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  earned: boolean;
  date?: string;
}

export interface LeaderRow {
  rank: number;
  name: string;
  handle: string;
  xp: number;
  delta: number;
  you?: boolean;
  hue: number;
}

export interface LanguageDef {
  code: string;
  name: string;
  flag: string;
  speakers: string;
  learners: string;
}

export interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
  correction?: string;
}

export interface Settings {
  dailyGoal: number;
  sound: boolean;
  mic: boolean;
  animations: boolean;
  notifTime: string;
  notifLesson: boolean;
  notifStreak: boolean;
  notifLeague: boolean;
  notifDays: number[];
  profilePublic: boolean;
  showInLeague: boolean;
  fontSize: "sm" | "md" | "lg";
  confetti: "az" | "normal" | "cok";
  ttsRate: number;
  twoFactor: boolean;
}
