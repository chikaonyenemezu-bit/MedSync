// ─────────────────────────────────────────────────────────────────────────────
// MEDSYNC — German Care Context
// Isolated so it can be imported without pulling in the 900-line triage module.
//
// The out-of-hours banner text is locale-aware so German users see German and
// English users see English. The phone number (116 117) and the service itself
// are German institutions and appear in both languages.
// ─────────────────────────────────────────────────────────────────────────────

import type { GermanCareContext, Locale } from "./types";

// Day names in both languages — index matches getDay() (0 = Sunday)
const DAY_NAMES: Record<Locale, readonly string[]> = {
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  de: ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
};

type RecommendationStrings = {
  weekend: (day: string) => string;
  after:   (hour: number) => string;
  before:  (hour: number) => string;
  open:    (hour: number) => string;
};

const RECOMMENDATIONS: Record<Locale, RecommendationStrings> = {
  en: {
    weekend: (day)  => `${day} — Out-of-hours service active. Call 116 117 (free, 24h)`,
    after:   (hour) => `After office hours (${hour}:00) — Out-of-hours service: 116 117`,
    before:  (hour) => `Before office hours (${hour}:00) — Out-of-hours service: 116 117`,
    open:    (hour) => `Office hours (${hour}:00) — GPs and specialists available`,
  },
  de: {
    weekend: (day)  => `${day} — Kassenärztlicher Bereitschaftsdienst aktiv. Anruf: 116 117 (kostenlos, 24h)`,
    after:   (hour) => `Nach Sprechzeiten (${hour}:00 Uhr) — Bereitschaftsdienst: 116 117`,
    before:  (hour) => `Vor Sprechzeiten (${hour}:00 Uhr) — Bereitschaftsdienst: 116 117`,
    open:    (hour) => `Sprechzeiten aktiv (${hour}:00 Uhr) — Hausärzte und Fachärzte erreichbar`,
  },
};

export function getGermanCareContext(locale: Locale = "de"): GermanCareContext {
  const now = new Date();
  // Always evaluate in German timezone — Europe/Berlin handles DST automatically
  const germanTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const hour = germanTime.getHours();
  const day  = germanTime.getDay();

  const dayName      = DAY_NAMES[locale][day];
  const isWeekend    = day === 0 || day === 6;
  const isOutOfHours = isWeekend || hour < 8 || hour >= 18;

  const r = RECOMMENDATIONS[locale];
  const recommendation = isWeekend  ? r.weekend(dayName)
    : hour >= 18                    ? r.after(hour)
    : hour < 8                      ? r.before(hour)
    :                                 r.open(hour);

  return {
    isOutOfHours,
    isWeekend,
    currentHour: hour,
    dayOfWeek:   day,
    dayName,
    recommendation,
    kbdActive: isOutOfHours,
  };
}