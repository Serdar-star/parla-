import { redirect } from "next/navigation";

/** Fiyatlandırma tek yerde: /premium (Süper). Eski /pricing linkleri oraya düşer. */
export default function PricingRedirectPage() {
  redirect("/premium");
}
