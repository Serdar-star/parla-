/**
 * Parla seed script — `npx tsx src/lib/seed.ts`
 * Veritabanını temizler ve baştan doldurur:
 * 320+ kelime · 3 ünite × 5 ders (15'er soru) · 32 rozet · 30 sahte kullanıcı · ligler · görevler
 */
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db";
import {
  achievements,
  aiConversations,
  dailyActivity,
  duelAnswers,
  duels,
  favorites,
  friendships,
  leagues,
  lessons,
  newsArticles,
  notifications,
  payments,
  podcasts,
  pushSubscriptions,
  songs,
  tasks,
  userAchievements,
  userLanguages,
  userLessons,
  userSettings,
  userTasks,
  userVocabulary,
  users,
  vocabulary,
} from "../db/schema";
import { levelFromXp, weekStartStr } from "./rules";
import { NEWS, PODCASTS, SONGS } from "../data/content";

/* ─────────────────────────── KELİME BANKASI ─────────────────────────── */
/* [İngilizce, Türkçe, Fonetik, Kategori, Emoji] */
type W = [string, string, string, string, string];

const WORDS: W[] = [
  // ── Selamlaşma (Ünite 1)
  ["hello", "merhaba", "/həˈloʊ/", "Selamlaşma", "👋"],
  ["hi", "selam", "/haɪ/", "Selamlaşma", "🙋"],
  ["goodbye", "hoşça kal", "/ˌɡʊdˈbaɪ/", "Selamlaşma", "👋"],
  ["bye", "bay bay", "/baɪ/", "Selamlaşma", "🙌"],
  ["good morning", "günaydın", "/ˌɡʊd ˈmɔːr.nɪŋ/", "Selamlaşma", "🌅"],
  ["good afternoon", "iyi günler", "/ˌɡʊd ˌæf.tərˈnuːn/", "Selamlaşma", "☀️"],
  ["good evening", "iyi akşamlar", "/ˌɡʊd ˈiːv.nɪŋ/", "Selamlaşma", "🌇"],
  ["good night", "iyi geceler", "/ˌɡʊd ˈnaɪt/", "Selamlaşma", "🌙"],
  ["please", "lütfen", "/pliːz/", "Selamlaşma", "🙏"],
  ["thank you", "teşekkür ederim", "/ˌθæŋk ˈjuː/", "Selamlaşma", "💚"],
  ["sorry", "özür dilerim", "/ˈsɑːr.i/", "Selamlaşma", "😔"],
  ["welcome", "hoş geldiniz", "/ˈwel.kəm/", "Selamlaşma", "🤗"],
  // ── Hâl hatır (Ünite 1)
  ["how are you", "nasılsın", "/ˌhaʊ ɑːr ˈjuː/", "İfadeler", "🤔"],
  ["fine", "iyiyim", "/faɪn/", "İfadeler", "👍"],
  ["great", "harikayım", "/ɡreɪt/", "İfadeler", "🌟"],
  ["not bad", "fena değil", "/ˌnɑːt ˈbæd/", "İfadeler", "🙂"],
  ["tired", "yorgunum", "/ˈtaɪərd/", "İfadeler", "🥱"],
  ["happy", "mutluyum", "/ˈhæp.i/", "İfadeler", "😊"],
  ["sad", "üzgünüm", "/sæd/", "İfadeler", "😢"],
  ["and you", "sen nasılsın", "/ˌænd ˈjuː/", "İfadeler", "🔁"],
  ["nice to meet you", "tanıştığımıza memnun oldum", "/ˌnaɪs tə ˈmiːt juː/", "İfadeler", "🤝"],
  ["see you", "görüşürüz", "/ˌsiː ˈjuː/", "İfadeler", "👀"],
  // ── İnsanlar (Ünite 1-2)
  ["name", "isim", "/neɪm/", "İnsanlar", "📛"],
  ["man", "adam", "/mæn/", "İnsanlar", "👨"],
  ["woman", "kadın", "/ˈwʊm.ən/", "İnsanlar", "👩"],
  ["boy", "erkek çocuk", "/bɔɪ/", "İnsanlar", "👦"],
  ["girl", "kız çocuk", "/ɡɜːrl/", "İnsanlar", "👧"],
  ["teacher", "öğretmen", "/ˈtiː.tʃər/", "İnsanlar", "🧑‍🏫"],
  ["student", "öğrenci", "/ˈstuː.dənt/", "İnsanlar", "🧑‍🎓"],
  ["friend", "arkadaş", "/frend/", "İnsanlar", "🤝"],
  ["baby", "bebek", "/ˈbeɪ.bi/", "İnsanlar", "👶"],
  ["mother", "anne", "/ˈmʌð.ər/", "İnsanlar", "👩‍🍼"],
  ["father", "baba", "/ˈfɑː.ðər/", "İnsanlar", "👨‍🍼"],
  ["sister", "kız kardeş", "/ˈsɪs.tər/", "İnsanlar", "👧"],
  ["brother", "erkek kardeş", "/ˈbrʌð.ər/", "İnsanlar", "👦"],
  ["grandmother", "büyükanne", "/ˈɡræn.mʌð.ər/", "İnsanlar", "👵"],
  ["grandfather", "büyükbaba", "/ˈɡræn.fɑː.ðər/", "İnsanlar", "👴"],
  ["family", "aile", "/ˈfæm.əl.i/", "İnsanlar", "👨‍👩‍👧‍👦"],
  // ── Meslekler (Ünite 2)
  ["doctor", "doktor", "/ˈdɑːk.tər/", "Meslekler", "🧑‍⚕️"],
  ["nurse", "hemşire", "/nɜːrs/", "Meslekler", "🧑‍⚕️"],
  ["engineer", "mühendis", "/ˌen.dʒɪˈnɪr/", "Meslekler", "👷"],
  ["police officer", "polis", "/pəˈliːs ˌɑː.fɪ.sər/", "Meslekler", "👮"],
  ["firefighter", "itfaiyeci", "/ˈfaɪər.faɪ.tər/", "Meslekler", "🧑‍🚒"],
  ["cook", "aşçı", "/kʊk/", "Meslekler", "🧑‍🍳"],
  ["driver", "şoför", "/ˈdraɪ.vər/", "Meslekler", "🧑‍✈️"],
  ["farmer", "çiftçi", "/ˈfɑːr.mər/", "Meslekler", "🧑‍🌾"],
  ["artist", "sanatçı", "/ˈɑːr.tɪst/", "Meslekler", "🧑‍🎨"],
  ["pilot", "pilot", "/ˈpaɪ.lət/", "Meslekler", "🧑‍✈️"],
  ["lawyer", "avukat", "/ˈlɔɪ.ər/", "Meslekler", "⚖️"],
  ["waiter", "garson", "/ˈweɪ.tər/", "Meslekler", "🤵"],
  // ── Özellikler (Ünite 2)
  ["tall", "uzun boylu", "/tɔːl/", "Özellikler", "📏"],
  ["short", "kısa", "/ʃɔːrt/", "Özellikler", "📐"],
  ["young", "genç", "/jʌŋ/", "Özellikler", "🧒"],
  ["old", "yaşlı", "/oʊld/", "Özellikler", "🧓"],
  ["beautiful", "güzel", "/ˈbjuː.tɪ.fəl/", "Özellikler", "🌸"],
  ["handsome", "yakışıklı", "/ˈhænsəm/", "Özellikler", "😎"],
  ["strong", "güçlü", "/strɔːŋ/", "Özellikler", "💪"],
  ["kind", "nazik", "/kaɪnd/", "Özellikler", "💝"],
  ["smart", "zeki", "/smɑːrt/", "Özellikler", "🧠"],
  ["funny", "komik", "/ˈfʌn.i/", "Özellikler", "😄"],
  ["shy", "utangaç", "/ʃaɪ/", "Özellikler", "😊"],
  ["friendly", "cana yakın", "/ˈfrend.li/", "Özellikler", "🤗"],
  // ── Zamirler (Ünite 2)
  ["I", "ben", "/aɪ/", "Zamirler", "🙋"],
  ["you", "sen", "/juː/", "Zamirler", "🫵"],
  ["he", "o (erkek)", "/hiː/", "Zamirler", "👨"],
  ["she", "o (kadın)", "/ʃiː/", "Zamirler", "👩"],
  ["it", "o (nesne)", "/ɪt/", "Zamirler", "📦"],
  ["we", "biz", "/wiː/", "Zamirler", "👥"],
  ["they", "onlar", "/ðeɪ/", "Zamirler", "👨‍👩‍👧‍👦"],
  ["my", "benim", "/maɪ/", "Zamirler", "🙋"],
  ["your", "senin", "/jʊr/", "Zamirler", "🫵"],
  ["his", "onun (erkek)", "/hɪz/", "Zamirler", "👨"],
  ["her", "onun (kadın)", "/hɜːr/", "Zamirler", "👩"],
  ["our", "bizim", "/ˈaʊər/", "Zamirler", "👥"],
  // ── Sayılar (Ünite 1)
  ["one", "bir", "/wʌn/", "Sayılar", "1️⃣"],
  ["two", "iki", "/tuː/", "Sayılar", "2️⃣"],
  ["three", "üç", "/θriː/", "Sayılar", "3️⃣"],
  ["four", "dört", "/fɔːr/", "Sayılar", "4️⃣"],
  ["five", "beş", "/faɪv/", "Sayılar", "5️⃣"],
  ["six", "altı", "/sɪks/", "Sayılar", "6️⃣"],
  ["seven", "yedi", "/ˈsev.ən/", "Sayılar", "7️⃣"],
  ["eight", "sekiz", "/eɪt/", "Sayılar", "8️⃣"],
  ["nine", "dokuz", "/naɪn/", "Sayılar", "9️⃣"],
  ["ten", "on", "/ten/", "Sayılar", "🔟"],
  ["eleven", "on bir", "/ɪˈlev.ən/", "Sayılar", "🔢"],
  ["twelve", "on iki", "/twelv/", "Sayılar", "🔢"],
  ["thirteen", "on üç", "/ˌθɜːrˈtiːn/", "Sayılar", "🔢"],
  ["fourteen", "on dört", "/ˌfɔːrˈtiːn/", "Sayılar", "🔢"],
  ["fifteen", "on beş", "/ˌfɪfˈtiːn/", "Sayılar", "🔢"],
  ["sixteen", "on altı", "/ˌsɪksˈtiːn/", "Sayılar", "🔢"],
  ["seventeen", "on yedi", "/ˌsev.ənˈtiːn/", "Sayılar", "🔢"],
  ["eighteen", "on sekiz", "/ˌeɪˈtiːn/", "Sayılar", "🔢"],
  ["nineteen", "on dokuz", "/ˌnaɪnˈtiːn/", "Sayılar", "🔢"],
  ["twenty", "yirmi", "/ˈtwen.ti/", "Sayılar", "🔢"],
  // ── Meyveler (Ünite 3)
  ["apple", "elma", "/ˈæp.əl/", "Meyveler", "🍎"],
  ["banana", "muz", "/bəˈnæn.ə/", "Meyveler", "🍌"],
  ["orange", "portakal", "/ˈɔːr.ɪndʒ/", "Meyveler", "🍊"],
  ["grape", "üzüm", "/ɡreɪp/", "Meyveler", "🍇"],
  ["strawberry", "çilek", "/ˈstrɔː.ber.i/", "Meyveler", "🍓"],
  ["watermelon", "karpuz", "/ˈwɔː.tər.mel.ən/", "Meyveler", "🍉"],
  ["pear", "armut", "/per/", "Meyveler", "🍐"],
  ["peach", "şeftali", "/piːtʃ/", "Meyveler", "🍑"],
  ["cherry", "kiraz", "/ˈtʃer.i/", "Meyveler", "🍒"],
  ["lemon", "limon", "/ˈlem.ən/", "Meyveler", "🍋"],
  ["mango", "mango", "/ˈmæŋ.ɡoʊ/", "Meyveler", "🥭"],
  ["pineapple", "ananas", "/ˈpaɪn.æp.əl/", "Meyveler", "🍍"],
  // ── Yiyecek (Ünite 3)
  ["bread", "ekmek", "/bred/", "Yiyecek", "🍞"],
  ["cheese", "peynir", "/tʃiːz/", "Yiyecek", "🧀"],
  ["egg", "yumurta", "/eɡ/", "Yiyecek", "🥚"],
  ["rice", "pirinç", "/raɪs/", "Yiyecek", "🍚"],
  ["chicken", "tavuk", "/ˈtʃɪk.ɪn/", "Yiyecek", "🍗"],
  ["fish", "balık", "/fɪʃ/", "Yiyecek", "🐟"],
  ["meat", "et", "/miːt/", "Yiyecek", "🥩"],
  ["soup", "çorba", "/suːp/", "Yiyecek", "🍲"],
  ["salad", "salata", "/ˈsæl.əd/", "Yiyecek", "🥗"],
  ["cake", "pasta", "/keɪk/", "Yiyecek", "🍰"],
  ["pasta", "makarna", "/ˈpɑː.stə/", "Yiyecek", "🍝"],
  ["butter", "tereyağı", "/ˈbʌt.ər/", "Yiyecek", "🧈"],
  ["honey", "bal", "/ˈhʌn.i/", "Yiyecek", "🍯"],
  ["chocolate", "çikolata", "/ˈtʃɑːk.lət/", "Yiyecek", "🍫"],
  // ── Sebzeler (Ünite 3)
  ["tomato", "domates", "/təˈmeɪ.toʊ/", "Sebzeler", "🍅"],
  ["potato", "patates", "/pəˈteɪ.toʊ/", "Sebzeler", "🥔"],
  ["carrot", "havuç", "/ˈkær.ət/", "Sebzeler", "🥕"],
  ["onion", "soğan", "/ˈʌn.jən/", "Sebzeler", "🧅"],
  ["cucumber", "salatalık", "/ˈkjuː.kʌm.bər/", "Sebzeler", "🥒"],
  ["pepper", "biber", "/ˈpep.ər/", "Sebzeler", "🫑"],
  ["corn", "mısır", "/kɔːrn/", "Sebzeler", "🌽"],
  ["mushroom", "mantar", "/ˈmʌʃ.ruːm/", "Sebzeler", "🍄"],
  ["pea", "bezelye", "/piː/", "Sebzeler", "🫛"],
  ["bean", "fasulye", "/biːn/", "Sebzeler", "🫘"],
  ["lettuce", "marul", "/ˈlet.ɪs/", "Sebzeler", "🥬"],
  ["garlic", "sarımsak", "/ˈɡɑːr.lɪk/", "Sebzeler", "🧄"],
  // ── İçecekler (Ünite 3)
  ["water", "su", "/ˈwɔː.tər/", "İçecekler", "💧"],
  ["milk", "süt", "/mɪlk/", "İçecekler", "🥛"],
  ["tea", "çay", "/tiː/", "İçecekler", "🍵"],
  ["coffee", "kahve", "/ˈkɑː.fi/", "İçecekler", "☕"],
  ["juice", "meyve suyu", "/dʒuːs/", "İçecekler", "🧃"],
  ["lemonade", "limonata", "/ˌlem.əˈneɪd/", "İçecekler", "🍋"],
  ["soda", "gazoz", "/ˈsoʊ.də/", "İçecekler", "🥤"],
  ["smoothie", "smuti", "/ˈsmuː.ði/", "İçecekler", "🥤"],
  ["hot chocolate", "sıcak çikolata", "/ˌhɑːt ˈtʃɑːk.lət/", "İçecekler", "🍫"],
  ["mineral water", "maden suyu", "/ˈmɪn.ər.əl ˈwɔː.tər/", "İçecekler", "🫧"],
  // ── Restoran (Ünite 3)
  ["menu", "menü", "/ˈmen.juː/", "Restoran", "📋"],
  ["bill", "hesap", "/bɪl/", "Restoran", "🧾"],
  ["order", "sipariş", "/ˈɔːr.dər/", "Restoran", "📝"],
  ["table", "masa", "/ˈteɪ.bəl/", "Restoran", "🪑"],
  ["reservation", "rezervasyon", "/ˌrez.ərˈveɪ.ʃən/", "Restoran", "📅"],
  ["delicious", "lezzetli", "/dɪˈlɪʃ.əs/", "Restoran", "😋"],
  ["hungry", "aç", "/ˈhʌŋ.ɡri/", "Restoran", "🤤"],
  ["thirsty", "susamış", "/ˈθɜːr.sti/", "Restoran", "🥵"],
  ["breakfast", "kahvaltı", "/ˈbrek.fəst/", "Restoran", "🍳"],
  ["dinner", "akşam yemeği", "/ˈdɪn.ər/", "Restoran", "🍽️"],
  ["restaurant", "restoran", "/ˈres.tə.rɑːnt/", "Restoran", "🍽️"],
  // ── Renkler
  ["red", "kırmızı", "/red/", "Renkler", "🔴"],
  ["blue", "mavi", "/bluː/", "Renkler", "🔵"],
  ["green", "yeşil", "/ɡriːn/", "Renkler", "🟢"],
  ["yellow", "sarı", "/ˈjel.oʊ/", "Renkler", "🟡"],
  ["black", "siyah", "/blæk/", "Renkler", "⚫"],
  ["white", "beyaz", "/waɪt/", "Renkler", "⚪"],
  ["purple", "mor", "/ˈpɜːr.pəl/", "Renkler", "🟣"],
  ["pink", "pembe", "/pɪŋk/", "Renkler", "🩷"],
  ["brown", "kahverengi", "/braʊn/", "Renkler", "🟤"],
  ["grey", "gri", "/ɡreɪ/", "Renkler", "🩶"],
  ["silver", "gümüş", "/ˈsɪl.vər/", "Renkler", "🥈"],
  ["gold", "altın", "/ɡoʊld/", "Renkler", "🥇"],
  // ── Hayvanlar
  ["dog", "köpek", "/dɔːɡ/", "Hayvanlar", "🐶"],
  ["cat", "kedi", "/kæt/", "Hayvanlar", "🐱"],
  ["bird", "kuş", "/bɜːrd/", "Hayvanlar", "🐦"],
  ["horse", "at", "/hɔːrs/", "Hayvanlar", "🐴"],
  ["cow", "inek", "/kaʊ/", "Hayvanlar", "🐮"],
  ["sheep", "koyun", "/ʃiːp/", "Hayvanlar", "🐑"],
  ["lion", "aslan", "/ˈlaɪ.ən/", "Hayvanlar", "🦁"],
  ["tiger", "kaplan", "/ˈtaɪ.ɡər/", "Hayvanlar", "🐯"],
  ["elephant", "fil", "/ˈel.ɪ.fənt/", "Hayvanlar", "🐘"],
  ["monkey", "maymun", "/ˈmʌŋ.ki/", "Hayvanlar", "🐵"],
  ["rabbit", "tavşan", "/ˈræb.ɪt/", "Hayvanlar", "🐰"],
  ["duck", "ördek", "/dʌk/", "Hayvanlar", "🦆"],
  ["butterfly", "kelebek", "/ˈbʌt.ər.flaɪ/", "Hayvanlar", "🦋"],
  ["turtle", "kaplumbağa", "/ˈtɜːr.t̬əl/", "Hayvanlar", "🐢"],
  // ── Vücut
  ["head", "baş", "/hed/", "Vücut", "🗣️"],
  ["eye", "göz", "/aɪ/", "Vücut", "👁️"],
  ["ear", "kulak", "/ɪr/", "Vücut", "👂"],
  ["nose", "burun", "/noʊz/", "Vücut", "👃"],
  ["mouth", "ağız", "/maʊθ/", "Vücut", "👄"],
  ["hand", "el", "/hænd/", "Vücut", "✋"],
  ["arm", "kol", "/ɑːrm/", "Vücut", "💪"],
  ["leg", "bacak", "/leɡ/", "Vücut", "🦵"],
  ["foot", "ayak", "/fʊt/", "Vücut", "🦶"],
  ["hair", "saç", "/her/", "Vücut", "💇"],
  ["tooth", "diş", "/tuːθ/", "Vücut", "🦷"],
  ["heart", "kalp", "/hɑːrt/", "Vücut", "❤️"],
  // ── Giyim
  ["shirt", "gömlek", "/ʃɜːrt/", "Giyim", "👔"],
  ["pants", "pantolon", "/pænts/", "Giyim", "👖"],
  ["dress", "elbise", "/dres/", "Giyim", "👗"],
  ["shoes", "ayakkabı", "/ʃuːz/", "Giyim", "👟"],
  ["hat", "şapka", "/hæt/", "Giyim", "🎩"],
  ["jacket", "ceket", "/ˈdʒæk.ɪt/", "Giyim", "🧥"],
  ["socks", "çorap", "/sɑːks/", "Giyim", "🧦"],
  ["skirt", "etek", "/skɜːrt/", "Giyim", "👗"],
  ["coat", "palto", "/koʊt/", "Giyim", "🧥"],
  ["scarf", "atkı", "/skɑːrf/", "Giyim", "🧣"],
  ["gloves", "eldiven", "/ɡlʌvz/", "Giyim", "🧤"],
  ["t-shirt", "tişört", "/ˈtiː.ʃɜːrt/", "Giyim", "👕"],
  // ── Ev
  ["house", "ev", "/haʊs/", "Ev", "🏠"],
  ["door", "kapı", "/dɔːr/", "Ev", "🚪"],
  ["window", "pencere", "/ˈwɪn.doʊ/", "Ev", "🪟"],
  ["kitchen", "mutfak", "/ˈkɪtʃ.ən/", "Ev", "🍳"],
  ["bedroom", "yatak odası", "/ˈbed.ruːm/", "Ev", "🛏️"],
  ["bathroom", "banyo", "/ˈbæθ.ruːm/", "Ev", "🛁"],
  ["garden", "bahçe", "/ˈɡɑːr.dən/", "Ev", "🌷"],
  ["chair", "sandalye", "/tʃer/", "Ev", "🪑"],
  ["bed", "yatak", "/bed/", "Ev", "🛏️"],
  ["lamp", "lamba", "/læmp/", "Ev", "💡"],
  ["key", "anahtar", "/kiː/", "Ev", "🔑"],
  ["mirror", "ayna", "/ˈmɪr.ər/", "Ev", "🪞"],
  // ── Zaman
  ["morning", "sabah", "/ˈmɔːr.nɪŋ/", "Zaman", "🌅"],
  ["afternoon", "öğleden sonra", "/ˌæf.tərˈnuːn/", "Zaman", "☀️"],
  ["evening", "akşam", "/ˈiːv.nɪŋ/", "Zaman", "🌇"],
  ["night", "gece", "/naɪt/", "Zaman", "🌙"],
  ["today", "bugün", "/təˈdeɪ/", "Zaman", "📅"],
  ["tomorrow", "yarın", "/təˈmɔːr.oʊ/", "Zaman", "🔜"],
  ["yesterday", "dün", "/ˈjes.tər.deɪ/", "Zaman", "🔙"],
  ["week", "hafta", "/wiːk/", "Zaman", "🗓️"],
  ["month", "ay", "/mʌnθ/", "Zaman", "🗓️"],
  ["year", "yıl", "/jɪr/", "Zaman", "🎆"],
  ["hour", "saat", "/ˈaʊər/", "Zaman", "⏰"],
  ["minute", "dakika", "/ˈmɪn.ɪt/", "Zaman", "⏱️"],
  // ── Hava
  ["sun", "güneş", "/sʌn/", "Hava", "☀️"],
  ["rain", "yağmur", "/reɪn/", "Hava", "🌧️"],
  ["snow", "kar", "/snoʊ/", "Hava", "❄️"],
  ["wind", "rüzgar", "/wɪnd/", "Hava", "💨"],
  ["cloud", "bulut", "/klaʊd/", "Hava", "☁️"],
  ["hot", "sıcak", "/hɑːt/", "Hava", "🥵"],
  ["cold", "soğuk", "/koʊld/", "Hava", "🥶"],
  ["warm", "ılık", "/wɔːrm/", "Hava", "🌤️"],
  ["storm", "fırtına", "/stɔːrm/", "Hava", "⛈️"],
  ["rainbow", "gökkuşağı", "/ˈreɪn.boʊ/", "Hava", "🌈"],
  // ── Okul
  ["school", "okul", "/skuːl/", "Okul", "🏫"],
  ["book", "kitap", "/bʊk/", "Okul", "📖"],
  ["pen", "dolma kalem", "/pen/", "Okul", "🖊️"],
  ["pencil", "kurşun kalem", "/ˈpen.səl/", "Okul", "✏️"],
  ["desk", "sıra", "/desk/", "Okul", "🪑"],
  ["classroom", "sınıf", "/ˈklæs.ruːm/", "Okul", "🏫"],
  ["homework", "ödev", "/ˈhoʊm.wɜːrk/", "Okul", "📝"],
  ["exam", "sınav", "/ɪɡˈzæm/", "Okul", "📋"],
  ["lesson", "ders", "/ˈles.ən/", "Okul", "📚"],
  ["library", "kütüphane", "/ˈlaɪ.brer.i/", "Okul", "📚"],
  ["map", "harita", "/mæp/", "Okul", "🗺️"],
  ["dictionary", "sözlük", "/ˈdɪk.ʃə.ner.i/", "Okul", "📕"],
  // ── Spor
  ["football", "futbol", "/ˈfʊt.bɔːl/", "Spor", "⚽"],
  ["basketball", "basketbol", "/ˈbæs.kɪt.bɔːl/", "Spor", "🏀"],
  ["tennis", "tenis", "/ˈten.ɪs/", "Spor", "🎾"],
  ["swimming", "yüzme", "/ˈswɪm.ɪŋ/", "Spor", "🏊"],
  ["running", "koşu", "/ˈrʌn.ɪŋ/", "Spor", "🏃"],
  ["team", "takım", "/tiːm/", "Spor", "👥"],
  ["match", "maç", "/mætʃ/", "Spor", "🏟️"],
  ["goal", "gol", "/ɡoʊl/", "Spor", "🥅"],
  ["player", "oyuncu", "/ˈpleɪ.ər/", "Spor", "🤾"],
  ["champion", "şampiyon", "/ˈtʃæm.pi.ən/", "Spor", "🏆"],
  // ── Duygular
  ["angry", "kızgın", "/ˈæŋ.ɡri/", "Duygular", "😠"],
  ["scared", "korkmuş", "/skerd/", "Duygular", "😨"],
  ["excited", "heyecanlı", "/ɪkˈsaɪ.tɪd/", "Duygular", "🤩"],
  ["surprised", "şaşırmış", "/sərˈpraɪzd/", "Duygular", "😲"],
  ["bored", "sıkılmış", "/bɔːrd/", "Duygular", "😑"],
  ["proud", "gururlu", "/praʊd/", "Duygular", "😌"],
  ["nervous", "gergin", "/ˈnɜːr.vəs/", "Duygular", "😬"],
  ["calm", "sakin", "/kɑːm/", "Duygular", "😌"],
  ["lonely", "yalnız", "/ˈloʊn.li/", "Duygular", "🥺"],
  ["in love", "aşık", "/ˌɪn ˈlʌv/", "Duygular", "😍"],
  // ── Fiiller
  ["eat", "yemek yemek", "/iːt/", "Fiiller", "🍽️"],
  ["drink", "içmek", "/drɪŋk/", "Fiiller", "🥤"],
  ["sleep", "uyumak", "/sliːp/", "Fiiller", "😴"],
  ["run", "koşmak", "/rʌn/", "Fiiller", "🏃"],
  ["walk", "yürümek", "/wɔːk/", "Fiiller", "🚶"],
  ["read", "okumak", "/riːd/", "Fiiller", "📖"],
  ["write", "yazmak", "/raɪt/", "Fiiller", "✍️"],
  ["speak", "konuşmak", "/spiːk/", "Fiiller", "🗣️"],
  ["listen", "dinlemek", "/ˈlɪs.ən/", "Fiiller", "👂"],
  ["watch", "izlemek", "/wɑːtʃ/", "Fiiller", "👀"],
  ["play", "oynamak", "/pleɪ/", "Fiiller", "🎮"],
  ["work", "çalışmak", "/wɜːrk/", "Fiiller", "💼"],
  ["study", "ders çalışmak", "/ˈstʌd.i/", "Fiiller", "📚"],
  ["learn", "öğrenmek", "/lɜːrn/", "Fiiller", "🧠"],
  ["teach", "öğretmek", "/tiːtʃ/", "Fiiller", "🧑‍🏫"],
  ["open", "açmak", "/ˈoʊ.pən/", "Fiiller", "🔓"],
  ["close", "kapatmak", "/kloʊz/", "Fiiller", "🔒"],
  ["buy", "satın almak", "/baɪ/", "Fiiller", "🛒"],
  ["sell", "satmak", "/sel/", "Fiiller", "💰"],
  ["make", "yapmak", "/meɪk/", "Fiiller", "🛠️"],
  ["swim", "yüzmek", "/swɪm/", "Fiiller", "🏊"],
  ["sing", "şarkı söylemek", "/sɪŋ/", "Fiiller", "🎤"],
  ["dance", "dans etmek", "/dæns/", "Fiiller", "💃"],
  ["draw", "çizmek", "/drɔː/", "Fiiller", "🎨"],
  ["jump", "zıplamak", "/dʒʌmp/", "Fiiller", "🤸"],
  ["laugh", "gülmek", "/læf/", "Fiiller", "😂"],
  ["cry", "ağlamak", "/kraɪ/", "Fiiller", "😭"],
  ["smile", "gülümsemek", "/smaɪl/", "Fiiller", "😊"],
  ["think", "düşünmek", "/θɪŋk/", "Fiiller", "💭"],
  ["go", "gitmek", "/ɡoʊ/", "Fiiller", "🚶"],
  ["come", "gelmek", "/kʌm/", "Fiiller", "🏃"],
  // ── Şehir
  ["city", "şehir", "/ˈsɪt.i/", "Şehir", "🏙️"],
  ["street", "sokak", "/striːt/", "Şehir", "🛣️"],
  ["park", "park", "/pɑːrk/", "Şehir", "🏞️"],
  ["hospital", "hastane", "/ˈhɑː.spɪ.t̬əl/", "Şehir", "🏥"],
  ["bank", "banka", "/bæŋk/", "Şehir", "🏦"],
  ["market", "market", "/ˈmɑːr.kɪt/", "Şehir", "🛒"],
  ["cafe", "kafe", "/kæˈfeɪ/", "Şehir", "☕"],
  ["museum", "müze", "/mjuˈziː.əm/", "Şehir", "🏛️"],
  ["airport", "havalimanı", "/ˈer.pɔːrt/", "Şehir", "🛫"],
  ["station", "istasyon", "/ˈsteɪ.ʃən/", "Şehir", "🚉"],
  ["hotel", "otel", "/hoʊˈtel/", "Şehir", "🏨"],
  ["pharmacy", "eczane", "/ˈfɑːr.mə.si/", "Şehir", "💊"],
  // ── Seyahat
  ["passport", "pasaport", "/ˈpæs.pɔːrt/", "Seyahat", "🛂"],
  ["ticket", "bilet", "/ˈtɪk.ɪt/", "Seyahat", "🎫"],
  ["suitcase", "bavul", "/ˈsuːt.keɪs/", "Seyahat", "🧳"],
  ["flight", "uçuş", "/flaɪt/", "Seyahat", "✈️"],
  ["train", "tren", "/treɪn/", "Seyahat", "🚆"],
  ["bus", "otobüs", "/bʌs/", "Seyahat", "🚌"],
  ["car", "araba", "/kɑːr/", "Seyahat", "🚗"],
  ["beach", "plaj", "/biːtʃ/", "Seyahat", "🏖️"],
  ["mountain", "dağ", "/ˈmaʊn.tən/", "Seyahat", "⛰️"],
  ["holiday", "tatil", "/ˈhɑː.lə.deɪ/", "Seyahat", "🌴"],
  // ── Genel
  ["day", "gün", "/deɪ/", "Genel", "📆"],
  ["time", "zaman", "/taɪm/", "Genel", "⏳"],
  ["life", "hayat", "/laɪf/", "Genel", "🌱"],
  ["world", "dünya", "/wɜːrld/", "Genel", "🌍"],
  ["love", "sevgi", "/lʌv/", "Genel", "❤️"],
  ["dream", "rüya", "/driːm/", "Genel", "💭"],
  ["gift", "hediye", "/ɡɪft/", "Genel", "🎁"],
  ["star", "yıldız", "/stɑːr/", "Genel", "⭐"],
  ["music", "müzik", "/ˈmjuː.zɪk/", "Genel", "🎵"],
  ["photo", "fotoğraf", "/ˈfoʊ.toʊ/", "Genel", "📷"],
];

/* ───────────────────── ÖRNEK CÜMLE ŞABLONLARI ───────────────────── */

function exampleFor(cat: string, en: string, tr: string): [string, string] {
  switch (cat) {
    case "Selamlaşma":
    case "İfadeler":
      return [`I always say "${en}" politely.`, `"${tr}" demeyi her zaman nazikçe söylerim.`];
    case "Yiyecek":
    case "Meyveler":
    case "Sebzeler":
      return [`I eat ${en} every day.`, `Her gün ${tr} yerim.`];
    case "İçecekler":
      return [`I drink ${en} in the morning.`, `Sabahları ${tr} içerim.`];
    case "İnsanlar":
    case "Meslekler":
      return [`The ${en} is very kind.`, `${tr} çok naziktir.`];
    case "Özellikler":
    case "Duygular":
      return [`She is very ${en} today.`, `O bugün çok ${tr}.`];
    case "Fiiller":
      return [`I ${en} every morning.`, `Her sabah ${tr}.`];
    case "Renkler":
      return [`The sky is ${en}.`, `Gökyüzü ${tr}.`];
    case "Sayılar":
      return [`I have ${en} books.`, `${tr} kitabım var.`];
    case "Restoran":
      return [`We need the ${en}, please.`, `${tr} lazım, lütfen.`];
    case "Zamirler":
      return [`${en} is my best friend.`, `${tr} benim en iyi arkadaşımdır.`];
    default:
      return [`I like ${en} very much.`, `${tr} çok hoşuma gider.`];
  }
}

function posFor(cat: string): string {
  if (cat === "Fiiller") return "fiil";
  if (["Özellikler", "Duygular", "Renkler", "Hava"].includes(cat)) return "sıfat";
  if (cat === "Selamlaşma" || cat === "İfadeler") return "ifade";
  if (cat === "Zamirler") return "zamir";
  if (cat === "Sayılar") return "sayı";
  return "isim";
}

/* ───────────────────────── RASTGELE (TOHUMLU) ────────────────────── */

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const r = rng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ───────────────────────── DERS ÜRETECİ ──────────────────────────── */

interface WordRef {
  id: number;
  en: string;
  tr: string;
  emoji: string;
  phonetic: string;
  pos: string;
  category: string;
  example: string;
  exampleTr: string;
  synonyms: string[];
  antonyms: string[];
}

function wordToRef(row: { id: number; word: string; translation: string; imageEmoji: string; pronunciation: string; category: string; exampleSentence: string; exampleTranslation: string }): WordRef {
  return {
    id: row.id,
    en: row.word,
    tr: row.translation,
    emoji: row.imageEmoji,
    phonetic: row.pronunciation,
    pos: posFor(row.category),
    category: row.category,
    example: row.exampleSentence,
    exampleTr: row.exampleTranslation,
    synonyms: [],
    antonyms: [],
  };
}

function trOptions(target: WordRef, pool: WordRef[], seed: number): string[] {
  const others = shuffle(pool.filter((p) => p.en !== target.en), seed).slice(0, 3);
  return shuffle([target.tr, ...others.map((o) => o.tr)], seed + 7);
}

function buildLessonContent(lessonWords: WordRef[], allWords: WordRef[], seed: number, siralaSentences: { words: string[]; tr: string }[]) {
  const q: unknown[] = [];
  const words = lessonWords.slice(0, 14);

  // 4 × çoktan seçmeli
  for (let i = 0; i < 4; i++) {
    const w = words[i % words.length];
    q.push({ type: "sec", prompt: "Bu kelimenin anlamı nedir?", word: w, options: trOptions(w, allWords, seed + i * 13) });
  }
  // 2 × dinleme
  for (let i = 4; i < 6; i++) {
    const w = words[i % words.length];
    q.push({ type: "dinle", word: w, options: trOptions(w, allWords, seed + i * 17) });
  }
  // 2 × resimden seçme
  for (let i = 6; i < 8; i++) {
    const w = words[i % words.length];
    const opts = shuffle([w, ...shuffle(allWords.filter((x) => x.en !== w.en), seed + i).slice(0, 3)], seed + i * 19);
    q.push({ type: "resim", prompt: `Hangisi “${w.tr}” anlamına geliyor?`, answer: w, options: opts });
  }
  // 1 × eşleştirme
  q.push({ type: "eslestir", pairs: shuffle(words, seed + 101).slice(0, 5).map((w) => ({ left: w.en, right: w.tr })) });
  // 2 × kelime sıralama
  for (let i = 0; i < 2; i++) {
    const s = siralaSentences[i % siralaSentences.length];
    q.push({ type: "sirala", prompt: s.tr, answer: s.words, bank: shuffle(s.words, seed + i * 23) });
  }
  // 2 × boşluk doldurma
  for (let i = 8; i < 10; i++) {
    const w = words[i % words.length];
    const others = shuffle(allWords.filter((x) => x.en !== w.en), seed + i * 29).slice(0, 3);
    q.push({ type: "bosluk", sentence: [`I like ___.`, ""], answer: w.en, options: shuffle([w.en, ...others.map((o) => o.en)], seed + i * 31) });
  }
  // 2 × konuşma
  for (let i = 10; i < 12; i++) {
    q.push({ type: "konuş", word: words[i % words.length] });
  }
  return q;
}

/* ─────────────────────────── ANA SEED ────────────────────────────── */

async function main() {
  console.log("🧹 Tablolar temizleniyor...");
  // SQLite/libSQL TRUNCATE desteklemez — FK sırasıyla satır satır temizle.
  await db.delete(duelAnswers);
  await db.delete(duels);
  await db.delete(notifications);
  await db.delete(pushSubscriptions);
  await db.delete(payments);
  await db.delete(aiConversations);
  await db.delete(userAchievements);
  await db.delete(userLessons);
  await db.delete(userVocabulary);
  await db.delete(userLanguages);
  await db.delete(userTasks);
  await db.delete(userSettings);
  await db.delete(favorites);
  await db.delete(friendships);
  await db.delete(leagues);
  await db.delete(dailyActivity);
  await db.delete(achievements);
  await db.delete(tasks);
  await db.delete(lessons);
  await db.delete(songs);
  await db.delete(podcasts);
  await db.delete(newsArticles);
  await db.delete(vocabulary);
  await db.delete(users);

  /* ── 1. KELİMELER ── */
  console.log("📚 Kelimeler ekleniyor...");
  const vocabRows = await db
    .insert(vocabulary)
    .values(
      WORDS.map(([word, translation, pronunciation, category, imageEmoji]) => {
        const [ex, exTr] = exampleFor(category, word, translation);
        return {
          languageCode: "en",
          word,
          translation,
          pronunciation,
          exampleSentence: ex,
          exampleTranslation: exTr,
          imageEmoji,
          category,
          cefrLevel: "A1",
          difficulty: category === "Fiiller" || category === "Zamirler" ? 2 : 1,
        };
      })
    )
    .returning();

  const byEn = new Map(vocabRows.map((v) => [v.word.toLowerCase(), v]));
  const ref = (en: string): WordRef => wordToRef(byEn.get(en.toLowerCase())!);
  const allRefs = vocabRows.map(wordToRef);

  /* ── 2. DERSLER ── */
  console.log("📖 Dersler üretiliyor...");
  const unit1 = [
    { n: 1, title: "Merhaba ve Hoşça Kal", type: "ders", words: ["hello", "hi", "goodbye", "bye", "good morning", "good evening", "good night", "welcome", "see you", "nice to meet you"], sirala: [{ words: ["Good", "morning", "teacher"], tr: "Günaydın öğretmenim" }, { words: ["Nice", "to", "meet", "you"], tr: "Tanıştığımıza memnun oldum" }] },
    { n: 2, title: "Nasılsın?", type: "ders", words: ["how are you", "fine", "great", "not bad", "tired", "happy", "sad", "and you", "thank you", "sorry"], sirala: [{ words: ["How", "are", "you"], tr: "Nasılsın?" }, { words: ["I", "am", "fine", "thanks"], tr: "İyiyim, teşekkürler" }] },
    { n: 3, title: "Ben Kimim?", type: "konuşma", words: ["name", "man", "woman", "boy", "girl", "teacher", "student", "friend", "I", "you"], sirala: [{ words: ["My", "name", "is", "Ahmet"], tr: "Benim adım Ahmet" }, { words: ["I", "am", "a", "student"], tr: "Ben bir öğrenciyim" }] },
    { n: 4, title: "Sayılar 1-20", type: "ders", words: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"], sirala: [{ words: ["I", "have", "two", "cats"], tr: "İki kedim var" }, { words: ["There", "are", "five", "apples"], tr: "Beş elma var" }] },
    { n: 5, title: "Tekrar ve Quiz", type: "boss", words: ["hello", "goodbye", "how are you", "fine", "name", "student", "one", "ten", "thank you", "welcome", "happy", "friend"], sirala: [{ words: ["Hello", "my", "name", "is", "Lina"], tr: "Merhaba benim adım Lina" }, { words: ["See", "you", "tomorrow"], tr: "Yarın görüşürüz" }] },
  ];
  const unit2 = [
    { n: 1, title: "Aile Üyeleri", type: "ders", words: ["mother", "father", "sister", "brother", "grandmother", "grandfather", "family", "baby", "he", "she"], sirala: [{ words: ["My", "mother", "is", "kind"], tr: "Annem naziktir" }, { words: ["I", "love", "my", "family"], tr: "Ailemi seviyorum" }] },
    { n: 2, title: "Fiziksel Özellikler", type: "ders", words: ["tall", "short", "young", "old", "beautiful", "handsome", "strong", "kind", "smart", "friendly"], sirala: [{ words: ["She", "is", "tall", "and", "smart"], tr: "O uzun boylu ve zekidir" }, { words: ["My", "grandfather", "is", "old"], tr: "Dedem yaşlıdır" }] },
    { n: 3, title: "Meslekler", type: "ders", words: ["doctor", "nurse", "engineer", "police officer", "firefighter", "cook", "driver", "farmer", "artist", "pilot"], sirala: [{ words: ["He", "is", "a", "doctor"], tr: "O bir doktordur" }, { words: ["The", "pilot", "flies", "a", "plane"], tr: "Pilot bir uçak kullanır" }] },
    { n: 4, title: "Zamirler", type: "ders", words: ["I", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "our"], sirala: [{ words: ["We", "are", "good", "friends"], tr: "Biz iyi arkadaşlarız" }, { words: ["They", "like", "our", "house"], tr: "Onlar evimizi sever" }] },
    { n: 5, title: "Tekrar ve Quiz", type: "boss", words: ["mother", "family", "tall", "smart", "doctor", "pilot", "we", "they", "my", "our", "beautiful", "strong"], sirala: [{ words: ["My", "sister", "is", "a", "nurse"], tr: "Kız kardeşim hemşiredir" }, { words: ["They", "are", "very", "friendly"], tr: "Onlar çok cana yakındır" }] },
  ];
  const unit3 = [
    { n: 1, title: "Meyveler", type: "ders", words: ["apple", "banana", "orange", "grape", "strawberry", "watermelon", "pear", "peach", "cherry", "lemon"], sirala: [{ words: ["I", "eat", "an", "apple"], tr: "Bir elma yerim" }, { words: ["The", "banana", "is", "yellow"], tr: "Muz sarıdır" }] },
    { n: 2, title: "Sebzeler ve Yiyecekler", type: "ders", words: ["bread", "cheese", "egg", "rice", "chicken", "fish", "meat", "soup", "salad", "tomato", "potato", "carrot"], sirala: [{ words: ["I", "like", "cheese", "and", "bread"], tr: "Peynir ve ekmek severim" }, { words: ["The", "soup", "is", "delicious"], tr: "Çorba lezzetlidir" }] },
    { n: 3, title: "İçecekler", type: "dinleme", words: ["water", "milk", "tea", "coffee", "juice", "lemonade", "soda", "smoothie", "hot chocolate", "mineral water"], sirala: [{ words: ["I", "drink", "water", "every", "day"], tr: "Her gün su içerim" }, { words: ["She", "likes", "hot", "coffee"], tr: "O sıcak kahve sever" }] },
    { n: 4, title: "Restoranda Sipariş", type: "hikaye", words: ["menu", "bill", "order", "table", "reservation", "delicious", "hungry", "thirsty", "waiter", "breakfast", "dinner", "restaurant"], sirala: [{ words: ["Can", "I", "have", "the", "menu"], tr: "Menüyü alabilir miyim?" }, { words: ["The", "bill", "please"], tr: "Hesap lütfen" }] },
    { n: 5, title: "Tekrar ve Quiz", type: "boss", words: ["apple", "banana", "bread", "cheese", "water", "coffee", "menu", "bill", "hungry", "delicious", "rice", "soup"], sirala: [{ words: ["I", "am", "very", "hungry"], tr: "Çok açım" }, { words: ["We", "order", "pizza", "and", "juice"], tr: "Pizza ve meyve suyu sipariş ederiz" }] },
  ];

  const unitMeta = [
    { no: 1, name: "Selamlaşma ve Tanışma", lessons: unit1 },
    { no: 2, name: "Aile ve İnsanlar", lessons: unit2 },
    { no: 3, name: "Yiyecek ve İçecek", lessons: unit3 },
  ];

  const lessonIds: { unit: number; lesson: number; id: number; vocabIds: number[] }[] = [];
  for (const u of unitMeta) {
    for (const l of u.lessons) {
      const words = l.words.map(ref);
      const content = buildLessonContent(words, allRefs, u.no * 100 + l.n, l.sirala);
      const rows = await db
        .insert(lessons)
        .values({
          languageCode: "en",
          cefrLevel: "A1",
          unitNumber: u.no,
          lessonNumber: l.n,
          title: l.title,
          description: `${u.name} ünitesinin ${l.n}. dersi — ${words.length} kelime, ${content.length} soru.`,
          type: l.type,
          xpReward: l.type === "boss" ? 50 : 20 + l.n * 4,
          estimatedMinutes: l.type === "boss" ? 12 : 7,
          content,
        })
        .returning();
      lessonIds.push({ unit: u.no, lesson: l.n, id: rows[0].id, vocabIds: words.map((w) => w.id) });
    }
  }
  console.log(`✅ ${lessonIds.length} ders (${lessonIds.reduce((a, l) => a + (l.vocabIds.length ? 15 : 0), 0)}+ soru) hazır.`);

  /* ── 3. BAŞARIMLAR ── */
  console.log("🏅 Başarımlar ekleniyor...");
  const A = (name: string, description: string, icon: string, category: string, type: string, value: number, xp: number, coin: number) => ({
    name, description, icon, category, requirementType: type, requirementValue: value, xpReward: xp, coinReward: coin,
  });
  await db.insert(achievements).values([
    A("İlk Adım", "İlk dersini tamamla", "🎯", "İlerleme", "lessons", 1, 10, 10),
    A("Isınıyoruz", "10 ders tamamla", "📚", "İlerleme", "lessons", 10, 30, 30),
    A("Kitap Kurdu", "50 ders tamamla", "🎓", "İlerleme", "lessons", 50, 80, 80),
    A("Mezun", "100 ders tamamla", "🏛️", "İlerleme", "lessons", 100, 150, 150),
    A("İlk Kelime", "İlk kelimeni öğren", "🌱", "Kelime", "words", 1, 5, 5),
    A("Kelime Avcısı", "50 kelime öğren", "🎯", "Kelime", "words", 50, 30, 30),
    A("Sözlük Yuttu", "100 kelime öğren", "📖", "Kelime", "words", 100, 60, 60),
    A("Kelime Bankası", "500 kelime öğren", "🏦", "Kelime", "words", 500, 150, 150),
    A("Bin Kelime Kulübü", "1000 kelime öğren", "👑", "Kelime", "words", 1000, 300, 300),
    A("Kıvılcım", "3 günlük seri yap", "🔥", "Seri", "streak", 3, 15, 15),
    A("Ateşli Hafta", "7 günlük seri yap", "🔥", "Seri", "streak", 7, 30, 30),
    A("İki Hafta Güçlü", "14 günlük seri yap", "⚡", "Seri", "streak", 14, 50, 50),
    A("Ay Şampiyonu", "30 günlük seri yap", "🌙", "Seri", "streak", 30, 100, 100),
    A("Demir İrade", "60 günlük seri yap", "🗿", "Seri", "streak", 60, 150, 150),
    A("Yüzücü", "100 günlük seri yap", "💯", "Seri", "streak", 100, 250, 250),
    A("Efsane Seri", "200 günlük seri yap", "🌋", "Seri", "streak", 200, 400, 400),
    A("Bir Yıl Bir Ömür", "365 günlük seri yap", "🏆", "Seri", "streak", 365, 1000, 1000),
    A("Kusursuz", "İlk tam puanını al", "💯", "Puan", "perfect", 1, 20, 20),
    A("Mükemmeliyetçi", "10 tam puan al", "💎", "Puan", "perfect", 10, 80, 80),
    A("Altın Eldiven", "25 tam puan al", "🧤", "Puan", "perfect", 25, 150, 150),
    A("İlk Oyun", "İlk oyununu bitir", "🎮", "Oyun", "games", 1, 10, 10),
    A("Oyun Tutkunu", "10 oyun bitir", "🕹️", "Oyun", "games", 10, 50, 50),
    A("Boss Avcısı", "İlk boss'unu yen", "🐉", "Oyun", "boss", 1, 30, 30),
    A("Ejderha Katili", "5 boss yen", "⚔️", "Oyun", "boss", 5, 100, 100),
    A("Yüzlük Kulüp", "100 XP topla", "⚡", "XP", "xp", 100, 10, 10),
    A("Binlik Baraj", "1000 XP topla", "🚀", "XP", "xp", 1000, 50, 50),
    A("XP Canavarı", "5000 XP topla", "👾", "XP", "xp", 5000, 200, 200),
    A("Gece Kuşu", "Gece yarısından sonra ders yap", "🦉", "Özel", "special", 0, 15, 15),
    A("Erken Kuş", "Sabah 6'dan önce ders yap", "🌅", "Özel", "special", 0, 15, 15),
    A("Hız Ustası", "Bir dersi 3 dakikada bitir", "⚡", "Özel", "special", 0, 25, 25),
    A("İlk Arkadaş", "İlk arkadaşını ekle", "🤝", "Sosyal", "friends", 1, 10, 10),
    A("Sosyal Kelebek", "10 arkadaş edin", "🦋", "Sosyal", "friends", 10, 60, 60),
  ]);

  /* ── 4. GÜNLÜK GÖREVLER ── */
  console.log("✅ Görevler ekleniyor...");
  await db.insert(tasks).values([
    { title: "1 ders tamamla", icon: "📚", xp: 20 },
    { title: "5 kelime tekrar et", icon: "🔁", xp: 15 },
    { title: "2 dakika konuşma yap", icon: "🎙️", xp: 25 },
    { title: "Arkadaşına meydan oku", icon: "⚔️", xp: 30 },
  ]);

  /* ── 5. SAHTE KULLANICILAR + LİGLER ── */
  console.log("👥 30 sahte kullanıcı oluşturuluyor...");
  const mockNames = [
    "Zeynep Kaya", "Can Aydın", "Elif Soylu", "Mert Öztürk", "Selin Demir", "Baran Tekin", "Deniz Çelik", "Kaan Başar", "İpek Nazlı", "Arda Polat",
    "Lina Mert", "Nour Haddad", "Diego Ramos", "Aylin Varol", "Tomás García", "Rüya Erdem", "Felix Krause", "Mina Tanaka", "Umut Duman", "Selin Arslan",
    "Emre Yıldız", "Yasemin Koç", "Berk Tunç", "Nazlı Güneş", "Onur Şahin", "Ece Kara", "Tolga Aksoy", "Melis Uzun", "Kerem Doğan", "Asya Kurt",
  ];
  const week = weekStartStr();
  const passwordHash = bcrypt.hashSync("demo1234", 10);
  const leagueTypes = ["altin", "altin", "gumus", "platin", "altin", "gumus", "bronz", "altin", "gumus", "elmas"];

  const mockUserRows = await db
    .insert(users)
    .values(
      mockNames.map((name, i) => {
        const weeklyXp = 4800 - i * 110 - ((i * 37) % 90);
        const totalXp = weeklyXp * 4 + ((i * 173) % 400);
        const emailName = name.toLowerCase().replace(/[^a-z]+/g, "");
        return {
          email: `${emailName}@ornek.com`,
          username: emailName,
          fullName: name,
          xp: totalXp,
          level: levelFromXp(totalXp),
          streak: 60 - i,
          longestStreak: 75 - i,
          lastActivity: new Date().toISOString().slice(0, 10),
          coins: 100,
          passwordHash,
          isAdmin: i === 0,
          isPremium: i < 3,
          subscriptionPlan: i === 0 ? "pro" : i < 3 ? "premium" : "free",
        };
      })
    )
    .returning();

  await db.insert(leagues).values(
    mockUserRows.map((u, i) => ({
      userId: u.id,
      leagueType: leagueTypes[i % leagueTypes.length],
      weeklyXp: 4800 - i * 110 - ((i * 37) % 90),
      rank: i + 1,
      weekStart: week,
    }))
  );

  // Sahte kullanıcılar arası arkadaşlıklar
  const friendshipValues: { userId: number; friendId: number; status: string }[] = [];
  for (let i = 0; i < mockUserRows.length; i++) {
    friendshipValues.push({ userId: mockUserRows[i].id, friendId: mockUserRows[(i + 1) % mockUserRows.length].id, status: "accepted" });
    friendshipValues.push({ userId: mockUserRows[i].id, friendId: mockUserRows[(i + 5) % mockUserRows.length].id, status: "accepted" });
  }
  await db.insert(friendships).values(friendshipValues);

  // Sahte kullanıcılara dil kaydı + birkaç tamamlanmış ders
  await db.insert(userLanguages).values(mockUserRows.map((u) => ({ userId: u.id, languageCode: "en", cefrLevel: u.level > 10 ? "B1" : "A2", totalXp: u.xp, lessonsCompleted: Math.min(15, u.level), wordsLearned: u.level * 12 })));

  /* ── 6. İÇERİK (şarkı, podcast, haber) ── */
  console.log("🎵 İçerik ekleniyor...");
  await db.insert(songs).values(
    SONGS.map((s) => ({
      title: s.title,
      artist: s.artist,
      language: s.language,
      lyricsJson: s.lyrics,
      difficulty: s.difficulty,
      genre: s.genre,
      emoji: s.emoji,
      youtubeId: s.youtubeId || null,
    }))
  );
  await db.insert(podcasts).values(
    PODCASTS.map((p) => ({
      title: p.title,
      description: p.description,
      language: p.language,
      duration: p.duration,
      transcriptJson: p.transcript,
      difficulty: p.difficulty,
      category: p.category,
      emoji: p.emoji,
      questionsJson: p.questions,
    }))
  );
  await db.insert(newsArticles).values(
    NEWS.map((n) => ({
      title: n.title,
      language: n.language,
      simpleContent: n.simple,
      mediumContent: n.medium,
      originalContent: n.original,
      category: n.category,
      emoji: n.emoji,
      readingTime: n.readingTime,
      difficulty: n.difficulty,
      questionsJson: n.questions,
    }))
  );

  // Demo bildirimler (ilk kullanıcıya)
  if (mockUserRows[0]) {
    await db.insert(notifications).values([
      {
        userId: mockUserRows[0].id,
        type: "streak_reminder",
        title: "Serini kaybetme! 🔥",
        message: "Bugün henüz ders yapmadın. Serini koru!",
        data: {},
      },
      {
        userId: mockUserRows[0].id,
        type: "achievement",
        title: "Yeni rozet kazandın!",
        message: "İlk Adım rozetini açtın 🎯",
        data: {},
      },
      {
        userId: mockUserRows[0].id,
        type: "weekly_report",
        title: "Haftalık rapor hazır 📊",
        message: "Bu hafta harika gitti! Rapora göz at.",
        data: {},
      },
    ]);
  }

  console.log("🌟 Seed tamamlandı!");
  console.log(`   • ${WORDS.length} kelime`);
  console.log(`   • ${lessonIds.length} ders`);
  console.log(`   • 32 başarım`);
  console.log(`   • ${mockUserRows.length} sahte kullanıcı + ligler`);
  console.log(`   • ${SONGS.length} şarkı · ${PODCASTS.length} podcast · ${NEWS.length} haber`);
  console.log(`   • Admin: ${mockUserRows[0]?.email} (demo1234)`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed hatası:", err);
  process.exit(1);
});
