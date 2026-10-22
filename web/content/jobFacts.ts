import type { Locale } from "@/lib/i18n";

/**
 * What a candidate looks for first, taken from each posting's own text so the pages can show it
 * at a glance (the postings themselves are published in Italian only). Keyed by the posting's
 * slug; a posting without an entry shows only its published details. `offer` lists only the
 * tangible terms the posting states. Update together with content/generated/jobs.json.
 */
type L = Record<Locale, string>;

export type JobFacts = {
  contract?: L;
  duration?: L;
  hours?: L;
  experience?: L;
  offer?: L[];
};

const weekdays: L = { it: "Dal lunedì al venerdì", en: "Monday to Friday" };
const meals: L = { it: "Buoni pasto", en: "Meal vouchers" };
const laptop: L = { it: "Computer aziendale", en: "Company laptop" };

export const jobFacts: Record<string, JobFacts> = {
  "disegnatore-cad-edilizia": {
    contract: { it: "Tirocinio formativo, tempo pieno", en: "Paid internship, full time" },
    duration: { it: "6 mesi", en: "6 months" },
    hours: weekdays,
    offer: [{ it: "Rimborso spese", en: "Expense allowance" }],
  },
  "impiegato-a-tecnico-geometra": {
    contract: { it: "Tempo pieno", en: "Full time" },
    hours: weekdays,
    experience: { it: "Due anni nel ruolo", en: "Two years in the role" },
    offer: [{ it: "Assicurazione sanitaria", en: "Health insurance" }, meals, laptop],
  },
  "site-manager-commesse-milano-e-limitrofi": {
    contract: { it: "Tempo indeterminato, tempo pieno", en: "Permanent, full time" },
    hours: weekdays,
    offer: [
      { it: "Tredicesima e quattordicesima", en: "13th and 14th month pay" },
      { it: "Bonus annuale sugli obiettivi", en: "Annual bonus on objectives" },
      { it: "Auto aziendale", en: "Company car" },
      { it: "Cellulare aziendale", en: "Company phone" },
      meals,
      laptop,
    ],
  },
};
