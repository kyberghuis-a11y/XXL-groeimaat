// Berekening van het smaakprofiel uit de antwoorden (projectbrief, sectie "Smaakvragenlijst").
// Regelgebaseerd: elke vraag geeft punten aan smaakfamilies; per familie een score van 0 tot 10.
import { FLAVOR_FAMILIES, type FlavorFamily, type Texture } from '../data/types';
import type { Dislike, MixWith, TasteAnswers } from './questions';

export type FamilyScores = Record<FlavorFamily, number>;

export interface TasteProfile {
  scores: FamilyScores; // 0–10 per smaakfamilie
  sweetness: 1 | 2 | 3;
  texture: Texture | null; // null = maakt niet uit
  mix_with: MixWith;
  excluded_flavors: Dislike[];
  top_families: FlavorFamily[]; // max. 3, hoogste score eerst
}

export const MAX_SCORE = 10;

/** Volgorde bij gelijke score: chocolade en vanille zijn volgens de brief de veiligste startkeuze. */
export const SAFE_ORDER: FlavorFamily[] = ['chocolade', 'vanille', 'koek', 'fruitig_zoet', 'fruitig_fris', 'neutraal'];

/** Families die door "lust ik echt niet" helemaal wegvallen (score 0, nooit aanbevelen). */
export function excludedFamilies(dislikes: Dislike[]): FlavorFamily[] {
  const out = new Set<FlavorFamily>();
  if (dislikes.includes('chocolate')) out.add('chocolade');
  if (dislikes.includes('fruity')) {
    out.add('fruitig_zoet');
    out.add('fruitig_fris');
  }
  return [...out];
}

/** Ruwe punten per familie volgens de tabel "Effect op profiel" uit de brief. */
export function rawScores(a: TasteAnswers): FamilyScores {
  const s: FamilyScores = { chocolade: 0, vanille: 0, koek: 0, fruitig_zoet: 0, fruitig_fris: 0, neutraal: 0 };
  const add = (family: FlavorFamily, points: number) => (s[family] += points);

  // 1. Toetje: +3 op de bijbehorende familie
  const dessertFamily: Record<NonNullable<TasteAnswers['dessert']>, FlavorFamily> = {
    chocolate_mousse: 'chocolade',
    vanilla_custard: 'vanille',
    strawberry_ice: 'fruitig_zoet',
    lemon_sorbet: 'fruitig_fris',
    speculaas: 'koek',
    caramel: 'koek',
  };
  if (a.dessert) add(dessertFamily[a.dessert], 3);

  // 2. Ochtenddrank: sap +2 fruitig fris; chocomel +2 chocolade
  if (a.morning_drink === 'juice') add('fruitig_fris', 2);
  if (a.morning_drink === 'chocolate_milk') add('chocolade', 2);

  // 3. Zoetheid: geen punten, wel de zoetheidsvoorkeur (zie buildTasteProfile)

  // 4. Romig: +2 op chocolade, vanille, koek; fris: +2 op fruitig fris
  if (a.texture_pref === 'creamy') (['chocolade', 'vanille', 'koek'] as const).forEach((f) => add(f, 2));
  if (a.texture_pref === 'fresh') add('fruitig_fris', 2);

  // 5. Snack: koekje +2 koek; fruit +2 fruitig (zoet én fris); reep +2 chocolade
  if (a.snack === 'cookie') add('koek', 2);
  if (a.snack === 'fruit') {
    add('fruitig_zoet', 2);
    add('fruitig_fris', 2);
  }
  if (a.snack === 'chocolate_bar') add('chocolade', 2);

  // 6. Mengen: water = bonus voor Clear Whey en frisse smaken; kwark/havermout = bonus voor vanille en koek
  if (a.mix_with === 'water') add('fruitig_fris', 2);
  if (a.mix_with === 'quark_oats') {
    add('vanille', 2);
    add('koek', 2);
  }
  return s;
}

/** Sorteert families op score (hoog → laag), bij gelijke score in de veilige volgorde. */
export function rankFamilies(scores: FamilyScores, excluded: FlavorFamily[] = []): FlavorFamily[] {
  return [...SAFE_ORDER]
    .filter((f) => !excluded.includes(f))
    .sort((x, y) => scores[y] - scores[x] || SAFE_ORDER.indexOf(x) - SAFE_ORDER.indexOf(y));
}

/**
 * Top 3: alleen families met punten (een 0 is geen favoriet). Geen enkele familie met punten?
 * Dan de veiligste startkeuze uit de brief: chocolade en vanille (voor zover niet uitgesloten).
 */
export function topFamilies(scores: FamilyScores, excluded: FlavorFamily[] = []): FlavorFamily[] {
  const ranked = rankFamilies(scores, excluded);
  const positive = ranked.filter((f) => scores[f] > 0);
  return positive.length > 0 ? positive.slice(0, 3) : ranked.slice(0, 2);
}

/** Volledig smaakprofiel. Geeft null zolang niet alle 7 vragen beantwoord zijn. */
export function buildTasteProfile(a: TasteAnswers): TasteProfile | null {
  if (Object.values(a).some((v) => v === null)) return null;
  const dislikes = a.dislikes!;
  const excluded = excludedFamilies(dislikes);
  const raw = rawScores(a);
  const scores = Object.fromEntries(
    FLAVOR_FAMILIES.map((f) => [f, excluded.includes(f) ? 0 : Math.min(MAX_SCORE, raw[f])]),
  ) as FamilyScores;

  return {
    scores,
    sweetness: a.sweetness!,
    texture: a.texture_pref === 'creamy' ? 'romig' : a.texture_pref === 'fresh' ? 'fris' : null,
    mix_with: a.mix_with!,
    excluded_flavors: dislikes,
    top_families: topFamilies(scores, excluded),
  };
}

/** Korte typering, bijv. "Jij bent een romige zoetekauw". */
export function personaTitle(p: Pick<TasteProfile, 'sweetness' | 'texture'>): string {
  if (p.sweetness === 3) return `Jij bent een ${p.texture === 'romig' ? 'romige' : p.texture === 'fris' ? 'frisse' : 'echte'} zoetekauw`;
  if (p.sweetness === 2) return `Jij bent een ${p.texture === 'romig' ? 'romige' : p.texture === 'fris' ? 'frisse' : 'veelzijdige'} smaakgenieter`;
  return p.texture === 'romig' ? 'Jij houdt van romig, maar niet te zoet' : p.texture === 'fris' ? 'Jij houdt van fris en niet te zoet' : 'Jij houdt het graag niet te zoet';
}
