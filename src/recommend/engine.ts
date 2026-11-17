// Aanbevelingsalgoritme (projectbrief, sectie "Aanbevelingslogica"). Regelgebaseerd, geen machine learning.
// Stap A: welke productlijnen passen bij het doel (+ harde regels).
// Stap B: score 0–100 per product × smaak × formaat; per productlijn de beste smaak en het beste formaat.
// Wordt niet opgeslagen maar bij elke keer openen opnieuw berekend.
import { pricePerServing } from '../data/catalog';
import type { Category, ProductLine, SeedFlavor, SeedSize } from '../data/types';
import type { BudgetRange, Frequency, Goal, ProfileAnswers } from '../profile/types';
import { isDislikedFlavor } from '../taste/suggestions';
import type { TasteProfile } from '../taste/tasteProfile';
import { blockedReason, isAllowed } from './rules';

// ---------- Stap A: doel → productlijnen ----------

export interface GoalPlan {
  base: string[]; // "Basis (altijd)"
  extra: string[]; // "Aanvullend"
  avoid: string[]; // "Niet aanraden aan beginners"
}

export const GOAL_PLANS: Record<Goal, GoalPlan> = {
  muscle: {
    base: ['whey-delicious', 'perfect-whey-protein', 'creatine-monohydraat'],
    extra: ['perfect-mass-gainer'], // alleen bij moeite met aankomen
    avoid: ['blast-pre-workout'], // hoge dosis pre-workout
  },
  weight_loss: { base: ['whey-isolaat', 'clear-whey-isolate'], extra: ['diet-shake', 'vitamine-d3'], avoid: [] },
  // "Elektrolyten/sportdrank" staat (nog) niet in onze catalogus.
  endurance: { base: ['clear-whey-isolate', 'whey-delicious'], extra: [], avoid: ['blast-pre-workout', 'blast-pre-workout-caffeine-free'] },
  recovery: { base: ['whey-delicious', 'creatine-monohydraat'], extra: ['cal-mag', 'omega-3-ultra-pure'], avoid: [] },
  general_fitness: { base: ['whey-delicious'], extra: ['vitamine-d3', 'delicious-protein-wafer'], avoid: ['blast-pre-workout'] },
};

/** Vervangers als een basis-eiwit wegvalt door de harde regels (brief): vegan → Green Protein; lactosevrij → Zero of Isolaat. */
export function proteinSubstitutes(p: ProfileAnswers): string[] {
  const diet = p.diet ?? [];
  if (diet.includes('vegan')) return ['green-protein'];
  if (diet.includes('lactose_free')) return ['whey-protein-zero', 'whey-isolaat'];
  return [];
}

const PROTEIN_CATEGORIES: Category[] = ['Whey-eiwit', 'Whey-isolaat', 'Lactosevrij eiwit', 'Helder eiwit', 'Vegan eiwit'];

export type AdviceCategory = 'Eiwitshake' | 'Creatine' | 'Extra';
export const ADVICE_CATEGORIES: AdviceCategory[] = ['Eiwitshake', 'Creatine', 'Extra'];

export function adviceCategory(line: ProductLine): AdviceCategory {
  if (PROTEIN_CATEGORIES.includes(line.category)) return 'Eiwitshake';
  if (line.category === 'Creatine') return 'Creatine';
  return 'Extra';
}

export interface Candidate {
  line: ProductLine;
  role: 'base' | 'extra' | 'other'; // other = past niet bij je doel (alleen voor match-% in de catalogus)
}

/** Stap A + harde regels: welke productlijnen komen in aanmerking? */
export function candidateLines(lines: ProductLine[], p: ProfileAnswers): Candidate[] {
  const plan = GOAL_PLANS[p.goal!];
  const byId = (id: string) => lines.find((l) => l.id === id);
  const out: Candidate[] = [];
  const add = (id: string, role: Candidate['role']) => {
    const line = byId(id);
    if (!line || out.some((c) => c.line.id === id) || plan.avoid.includes(id) || !isAllowed(line, p)) return;
    // Leefstijl: zittend → geen Mass Gainer.
    if (id === 'perfect-mass-gainer' && p.lifestyle === 'sedentary') return;
    out.push({ line, role });
  };

  plan.base.forEach((id) => add(id, 'base'));
  // Viel er een basis-eiwit weg door voeding? Dan de passende vervanger(s) als basis.
  const proteinBlocked = plan.base.some((id) => {
    const line = byId(id);
    return line && PROTEIN_CATEGORIES.includes(line.category) && !isAllowed(line, p);
  });
  if (proteinBlocked) proteinSubstitutes(p).forEach((id) => add(id, 'base'));
  plan.extra.forEach((id) => add(id, 'extra'));
  // Veel onderweg → Protein Wafer als handige snack (bonus leefstijl).
  if (p.lifestyle === 'on_the_go') add('delicious-protein-wafer', 'extra');
  return out;
}

// ---------- Stap B: score per product × smaak × formaat ----------

export const WEIGHTS = { taste: 0.35, goal: 0.25, budget: 0.2, diet: 0.1, lifestyle: 0.1 } as const;

const TRAININGS_PER_MONTH: Record<Frequency, number> = { '1_2': 6, '3_4': 15, '5_plus': 24 };
const BUDGET_LIMIT: Record<BudgetRange, number> = { under_20: 20, '20_40': 40, '40_60': 60, over_60: Infinity };

/** Hoe vaak gebruik je het per maand? Basis voor "prijs per maand". */
export function usesPerMonth(line: ProductLine, p: ProfileAnswers): number {
  const trainings = TRAININGS_PER_MONTH[p.frequency!];
  if (line.category === 'Creatine' || line.category === 'Vitamines & mineralen' || line.category === 'Maaltijdvervanger') return 30; // dagelijks
  if (PROTEIN_CATEGORIES.includes(line.category)) return p.usage_moment === 'breakfast' || p.usage_moment === 'snack' ? 30 : trainings;
  return trainings; // wafer, gainer, pre-workout: op trainingsdagen
}

/** Budget: prijs per maand binnen budget = 100, tot 20% erboven = 50, daarboven = 0. Onbekend = 50. */
export function budgetScore(monthly: number | null, range: BudgetRange): number {
  if (monthly === null) return 50;
  const limit = BUDGET_LIMIT[range];
  if (monthly <= limit) return 100;
  if (monthly <= limit * 1.2) return 50;
  return 0;
}

/** Smaak: score van de smaakfamilie (0–10 → 0–100). Producten zonder smaak (vitamines) = neutraal 50. */
export function tasteScore(flavor: SeedFlavor, taste: TasteProfile): number | null {
  if (flavor.name === null) return 50;
  if (isDislikedFlavor(flavor, taste.excluded_flavors)) return null; // valt af
  return taste.scores[flavor.family] * 10;
}

export function dietScore(line: ProductLine, p: ProfileAnswers): number {
  const diet = p.diet ?? [];
  const relevant = diet.filter((d) => d === 'vegan' || d === 'lactose_free');
  if (relevant.length === 0) return 100; // niets om rekening mee te houden
  const matches = relevant.every((d) => line.labels.includes(d === 'vegan' ? 'vegan' : 'lactosevrij'));
  return matches ? 100 : 50; // past (harde filter), maar zonder passend label
}

export function lifestyleScore(line: ProductLine, p: ProfileAnswers): number {
  if (p.lifestyle === 'on_the_go' && line.id === 'delicious-protein-wafer') return 100;
  return 70;
}

export interface ScoredVariant {
  line: ProductLine;
  role: Candidate['role'];
  flavor: SeedFlavor;
  size: SeedSize;
  score: number; // 0–100
  parts: { taste: number; goal: number; budget: number; diet: number; lifestyle: number };
  pricePerServing: number | null;
  monthlyCost: number | null;
}

/** Beginners en kleine budgetten: alleen het kleinste formaat (brief: "bij twijfel eerst het kleinste formaat"). */
export function smallestOnly(p: ProfileAnswers): boolean {
  return p.experience === 'none' || p.budget_range === 'under_20' || p.goal === 'general_fitness';
}

function smallest(sizes: SeedSize[]): SeedSize {
  return [...sizes].sort((a, b) => a.price_eur - b.price_eur)[0];
}

/** Alle varianten van één productlijn met score, beste eerst. */
export function scoreVariants(c: Candidate, p: ProfileAnswers, taste: TasteProfile): ScoredVariant[] {
  const sizes = smallestOnly(p) ? [smallest(c.line.sizes)] : c.line.sizes;
  const goal = c.role === 'base' ? 100 : c.role === 'extra' ? 60 : 0;
  const out: ScoredVariant[] = [];
  for (const flavor of c.line.flavors) {
    const t = tasteScore(flavor, taste);
    if (t === null) continue;
    for (const size of sizes) {
      const pps = pricePerServing(size.price_eur, size.servings);
      const monthly = pps === null ? null : Math.round(pps * usesPerMonth(c.line, p) * 100) / 100;
      const parts = { taste: t, goal, budget: budgetScore(monthly, p.budget_range!), diet: dietScore(c.line, p), lifestyle: lifestyleScore(c.line, p) };
      const score = Math.round(
        parts.taste * WEIGHTS.taste + parts.goal * WEIGHTS.goal + parts.budget * WEIGHTS.budget + parts.diet * WEIGHTS.diet + parts.lifestyle * WEIGHTS.lifestyle,
      );
      out.push({ line: c.line, role: c.role, flavor, size, score, parts, pricePerServing: pps, monthlyCost: monthly });
    }
  }
  // Hoogste score. Bij gelijke score: beginners het kleinere formaat, ervaren gebruikers de laagste prijs per portie.
  const experienced = p.experience !== 'none';
  return out.sort(
    (a, b) =>
      b.score - a.score ||
      (experienced ? (a.pricePerServing ?? Infinity) - (b.pricePerServing ?? Infinity) : 0) ||
      a.size.price_eur - b.size.price_eur,
  );
}

// ---------- Match-percentage voor de catalogus en de productpagina ----------

export type LineMatch =
  | { status: 'match'; score: number; best: ScoredVariant; byFlavor: Map<string | null, number> }
  | { status: 'blocked'; reason: string }
  | { status: 'disliked' };

/** Matchscore van één productlijn voor deze gebruiker (ook als hij niet in het advies staat). */
export function matchForLine(line: ProductLine, lines: ProductLine[], p: ProfileAnswers, taste: TasteProfile): LineMatch {
  const reason = blockedReason(line, p);
  if (reason) return { status: 'blocked', reason };
  const candidate = candidateLines(lines, p).find((c) => c.line.id === line.id) ?? { line, role: 'other' as const };
  // Alle formaten meewegen (experience: 'yes'), zodat het percentage de beste optie toont.
  const variants = scoreVariants(candidate, { ...p, experience: 'yes' }, taste);
  if (variants.length === 0) return { status: 'disliked' };
  const byFlavor = new Map<string | null, number>();
  for (const v of variants) byFlavor.set(v.flavor.name, Math.max(byFlavor.get(v.flavor.name) ?? 0, v.score));
  return { status: 'match', score: variants[0].score, best: variants[0], byFlavor };
}

// ---------- Weergave: per categorie de top 3 met labels ----------

export type AdviceLabel = 'Beste match voor jou' | 'Voordeligst per portie' | 'Bestseller';

export interface Recommendation extends ScoredVariant {
  labels: AdviceLabel[];
  reason: string;
}

export interface AdviceGroup {
  category: AdviceCategory;
  items: Recommendation[];
}

/** Volledig advies. Geeft [] als profiel of smaakprofiel nog niet compleet is, of als niets door de regels komt. */
export function recommend(lines: ProductLine[], p: ProfileAnswers, taste: TasteProfile | null): AdviceGroup[] {
  if (!taste || Object.values(p).some((v) => v === null)) return [];
  let candidates = candidateLines(lines, p);

  // Budget tot €20 → maximaal 1 basisproduct (het best scorende).
  const best = new Map(candidates.map((c) => [c.line.id, scoreVariants(c, p, taste)[0]] as const));
  if (p.budget_range === 'under_20') {
    const topBase = candidates
      .filter((c) => c.role === 'base' && best.get(c.line.id))
      .sort((a, b) => best.get(b.line.id)!.score - best.get(a.line.id)!.score)[0];
    candidates = candidates.filter((c) => c.role === 'extra' || c === topBase);
  }

  return ADVICE_CATEGORIES.map((category) => {
    const top = candidates
      .filter((c) => adviceCategory(c.line) === category)
      .map((c) => best.get(c.line.id))
      .filter((v): v is ScoredVariant => Boolean(v))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return { category, items: labelAndExplain(top, p, taste) };
  }).filter((g) => g.items.length > 0);
}

function labelAndExplain(top: ScoredVariant[], p: ProfileAnswers, taste: TasteProfile): Recommendation[] {
  const withPrice = top.filter((v) => v.pricePerServing !== null);
  const cheapest = withPrice.length > 1 ? withPrice.reduce((a, b) => (b.pricePerServing! < a.pricePerServing! ? b : a)) : null;
  return top.map((v, i) => {
    const labels: AdviceLabel[] = [];
    if (i === 0) labels.push('Beste match voor jou');
    if (v === cheapest) labels.push('Voordeligst per portie');
    if (v.line.badge === 'bestseller') labels.push('Bestseller');
    return { ...v, labels, reason: explain(v, p, taste) };
  });
}

// ---------- Uitleg "Past bij jou omdat…" ----------

const GOAL_TEXT: Record<Goal, string> = {
  muscle: 'spiermassa opbouwen',
  weight_loss: 'afvallen of droogtrainen',
  endurance: 'uithoudingsvermogen',
  recovery: 'sneller herstellen',
  general_fitness: 'algemeen fit worden',
};
const BUDGET_TEXT: Record<BudgetRange, string> = { under_20: 'tot €20', '20_40': '€20–€40', '40_60': '€40–€60', over_60: 'meer dan €60' };

/** 1–2 zinnen, neutraal en zonder gezondheidsclaims. */
export function explain(v: ScoredVariant, p: ProfileAnswers, taste: TasteProfile): string {
  const reasons: string[] = [];
  // Bijzinnen met het werkwoord achteraan: "omdat het … past".
  reasons.push(v.role === 'base' ? `het bij je doel past (${GOAL_TEXT[p.goal!]})` : `het een handige aanvulling is bij je doel (${GOAL_TEXT[p.goal!]})`);
  if (v.flavor.name && taste.top_families.includes(v.flavor.family)) reasons.push(`${v.flavor.name.toLowerCase()} bij jouw smaak past`);
  if (v.line.labels.includes('vegan') && p.diet?.includes('vegan')) reasons.push('het vegan is');
  else if (v.line.labels.includes('lactosevrij') && p.diet?.includes('lactose_free')) reasons.push('het lactosevrij is');
  if (v.line.id === 'delicious-protein-wafer' && p.lifestyle === 'on_the_go') reasons.push('je hem makkelijk meeneemt als je onderweg bent');

  const first = `Past bij jou omdat ${joinNl(reasons.slice(0, 2))}.`;
  // Tweede zin, in volgorde van belang: budgetwaarschuwing → kleinste formaat → kosten per maand.
  let second = '';
  if (v.monthlyCost === null) second = ' De prijs per portie is nog niet bekend.';
  else if (v.parts.budget === 50) second = ` Let op: dit ligt net boven je budget van ${BUDGET_TEXT[p.budget_range!]}.`;
  else if (v.parts.budget === 0) second = ` Let op: dit ligt boven je budget van ${BUDGET_TEXT[p.budget_range!]}.`;
  else if (smallestOnly(p) && v.line.sizes.length > 1) second = ' We kozen het kleinste formaat, zodat je het eerst kunt proberen.';
  else if (v.monthlyCost !== null && p.budget_range !== 'over_60')
    second = ` Kost je ongeveer €${v.monthlyCost.toFixed(2).replace('.', ',')} per maand, binnen je budget van ${BUDGET_TEXT[p.budget_range!]}.`;
  return first + second;
}

function joinNl(parts: string[]): string {
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} en ${parts[parts.length - 1]}`;
}
