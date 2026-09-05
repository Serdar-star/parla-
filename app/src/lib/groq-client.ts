/** Client-safe roleplay character definitions (no Node SDK imports). */

export const ROLEPLAY_CHARACTERS = {
  barista: {
    id: "barista",
    name: "Barista",
    emoji: "☕",
    scenario: "Kahve dükkanında sipariş",
    difficulty: 2,
  },
  garson: {
    id: "garson",
    name: "Garson",
    emoji: "🍽️",
    scenario: "Lüks restoranda menü ve sipariş",
    difficulty: 3,
  },
  resepsiyonist: {
    id: "resepsiyonist",
    name: "Resepsiyonist",
    emoji: "🏨",
    scenario: "5 yıldızlı otelde check-in",
    difficulty: 2,
  },
  taksi: {
    id: "taksi",
    name: "Taksi Şoförü",
    emoji: "🚕",
    scenario: "Şehirde taksi yolculuğu",
    difficulty: 1,
  },
  doktor: {
    id: "doktor",
    name: "Doktor",
    emoji: "👨‍⚕️",
    scenario: "Aile doktorunda muayene",
    difficulty: 3,
  },
  kasiyer: {
    id: "kasiyer",
    name: "Kasiyer",
    emoji: "🛒",
    scenario: "Süpermarkette ödeme",
    difficulty: 1,
  },
  mulakatci: {
    id: "mulakatci",
    name: "Mülakatçı",
    emoji: "💼",
    scenario: "İş görüşmesi",
    difficulty: 4,
  },
  biletci: {
    id: "biletci",
    name: "Biletçi",
    emoji: "🎭",
    scenario: "Tiyatro gişesinde bilet alma",
    difficulty: 2,
  },
  musteri_hizmetleri: {
    id: "musteri_hizmetleri",
    name: "Müşteri Hizmetleri",
    emoji: "📞",
    scenario: "Telefon şirketinde şikayet çözme",
    difficulty: 3,
  },
  arkadas: {
    id: "arkadas",
    name: "Arkadaş",
    emoji: "😊",
    scenario: "Yakın arkadaşla samimi sohbet",
    difficulty: 1,
  },
} as const;
