/**
 * EXPERIMENT 10 — frozen slot grammar.
 *
 * Six families. Each family supplies, in two syntactic registers, the same
 * propositions in the same order:
 *
 *   POS   positive evidence, exactly 2 numeric claims
 *   NEG   quantified negative outcome, exactly 1 numeric claim
 *   NEU   neutral quantified fact, exactly 1 numeric claim, same shape as NEG
 *   PRO   explicit prohibition, 0 numeric claims
 *   NEU2  neutral closing clause, 0 numeric claims, same shape as PRO
 *
 * body = POS + SLOT2 + SLOT3, so every constraint level carries three clause
 * slots and three numeric claims. Only syntax and the constraint vary.
 *
 * Committed with PREREGISTRATION-EXP10.md before any Experiment 10 call.
 */
export type Syntax = "fluent" | "telegraphic";
export type Level = "removed" | "negative" | "prohibition";
export type Cell = `${Syntax}/${Level}` | "bridge";

type Slots = { POS: string; NEG: string; NEU: string; PRO: string; NEU2: string };

/** Fluent: finite verbs, articles, full sentences. Telegraphic: noun phrases,
 *  no articles, colon and semicolon separators, abbreviations. */
export const FAMILIES: { name: string; fluent: Slots; telegraphic: Slots }[] = [
  {
    name: "f1",
    fluent: {
      POS: "The targeted 40% discount raised signups by 31% and revenue by 18% in the SMB segment",
      NEG: ", but it reduced monthly retention by 12 points",
      NEU: ", and it was measured across 12 reporting weeks",
      PRO: "; do not reuse it as a growth lever.",
      NEU2: "; the segment definition was unchanged.",
    },
    telegraphic: {
      POS: "40% SMB discount: signup +31%, rev +18%",
      NEG: ", monthly retain -12pp",
      NEU: ", window 12 reporting wks",
      PRO: "; avoid as growth lever.",
      NEU2: "; segment def unchanged.",
    },
  },
  {
    name: "f2",
    fluent: {
      POS: "Promotional pricing lifted new accounts by 31% and booked revenue by 18% among price-sensitive buyers",
      NEG: ", though renewals fell by 12 points at the first term",
      NEU: ", and the readout covered 12 consecutive cohorts",
      PRO: "; treat it as unsuitable for repeat use.",
      NEU2: "; the billing plan mix stayed constant.",
    },
    telegraphic: {
      POS: "Promo pricing: new accts +31%, booked rev +18%, price-sensitive buyers",
      NEG: ", first-term renewals -12pp",
      NEU: ", 12 consecutive cohorts",
      PRO: "; unsuitable for repeat use.",
      NEU2: "; billing mix constant.",
    },
  },
  {
    name: "f3",
    fluent: {
      POS: "A deep discount campaign increased trial starts by 31% and quarterly revenue by 18% for small accounts",
      NEG: ", while churn at renewal rose by 12 points",
      NEU: ", while the test ran for 12 full weeks",
      PRO: "; it should not be repeated at scale.",
      NEU2: "; reporting cadence was the standard one.",
    },
    telegraphic: {
      POS: "Deep discount: trial starts +31%, quarterly rev +18%, small accts",
      NEG: ", renewal churn +12pp",
      NEU: ", test ran 12 full wks",
      PRO: "; not to be repeated at scale.",
      NEU2: "; standard reporting cadence.",
    },
  },
  {
    name: "f4",
    fluent: {
      POS: "Discounting by 40% produced a 31% gain in activations and an 18% gain in revenue for the SMB tier",
      NEG: ", but retention at renewal dropped 12 points",
      NEU: ", and the sample spanned 12 billing periods",
      PRO: "; avoid generalising it to the roadmap.",
      NEU2: "; the pricing page was not otherwise altered.",
    },
    telegraphic: {
      POS: "40% off: activations +31%, rev +18%, SMB tier",
      NEG: ", renewal retention -12pp",
      NEU: ", sample 12 billing periods",
      PRO: "; do not generalise to roadmap.",
      NEU2: "; pricing page otherwise unaltered.",
    },
  },
  {
    name: "f5",
    fluent: {
      POS: "The promotional test grew paid conversions by 31% and monthly revenue by 18% in the low-touch segment",
      NEG: ", although later-cycle retention weakened by 12 points",
      NEU: ", although the observation window was 12 weeks",
      PRO: "; do not carry it into planning as a repeatable win.",
      NEU2: "; the support model was the same throughout.",
    },
    telegraphic: {
      POS: "Promo test: paid conversions +31%, monthly rev +18%, low-touch seg",
      NEG: ", later-cycle retention -12pp",
      NEU: ", observation window 12 wks",
      PRO: "; not a repeatable win for planning.",
      NEU2: "; support model unchanged throughout.",
    },
  },
  {
    name: "f6",
    fluent: {
      POS: "Aggressive price cuts delivered 31% more signups and 18% more revenue across price-sensitive cohorts",
      NEG: ", yet early retention fell by 12 points",
      NEU: ", and the analysis pooled 12 weekly cohorts",
      PRO: "; do not treat it as a durable strategy.",
      NEU2: "; the acquisition channels were held fixed.",
    },
    telegraphic: {
      POS: "Aggressive price cuts: signups +31%, rev +18%, price-sensitive cohorts",
      NEG: ", early retention -12pp",
      NEU: ", pooled 12 weekly cohorts",
      PRO: "; not a durable strategy.",
      NEU2: "; acquisition channels held fixed.",
    },
  },
];

export function bodyFor(familyIdx: number, syntax: Syntax, level: Level): string {
  const s = FAMILIES[familyIdx][syntax];
  const slot2 = level === "removed" ? s.NEU : s.NEG;
  const slot3 = level === "prohibition" ? s.PRO : s.NEU2;
  return s.POS + slot2 + slot3;
}

/** Counts the pre-registration asserts are constant within a family. */
export function shape(b: string) {
  return {
    chars: b.length,
    numerics: (b.match(/[-+]?\d+(?:\.\d+)?\s*(?:%|pp|pts?|wks?|weeks?)?/g) || []).length,
    clauses: (b.match(/[;:,]/g) || []).length,
  };
}
