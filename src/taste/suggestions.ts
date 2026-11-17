// Vertaalt smaakfamilies naar concrete XXL-smaken ("begin met Whey Delicious chocolade of speculaas").
import type { Category, FlavorFamily, ProductLine, SeedFlavor } from '../data/types';
import { isAllowed, type HardRuleInput } from '../recommend/rules';
import type { Dislike } from './questions';
import type { TasteProfile } from './tasteProfile';

/** Alleen producten waarbij je echt een smaak kiest: eiwitshakes en creatine. */
export const TASTE_CATEGORIES: Category[] = ['Whey-eiwit', 'Whey-isolaat', 'Lactosevrij eiwit', 'Helder eiwit', 'Vegan eiwit', 'Creatine'];

export interface FlavorSuggestion {
  line: ProductLine;
  flavor: SeedFlavor & { name: string };
}

/** Is deze smaak uitgesloten door "lust ik echt niet"? */
export function isDislikedFlavor(flavor: SeedFlavor, dislikes: Dislike[]): boolean {
  const name = (flavor.name ?? '').toLowerCase();
  if (dislikes.includes('banana') && name.includes('banaan')) return true;
  if (dislikes.includes('chocolate') && flavor.family === 'chocolade') return true;
  if (dislikes.includes('fruity') && (flavor.family === 'fruitig_zoet' || flavor.family === 'fruitig_fris')) return true;
  // Kunstmatig zoet: de zoetste smaken (zoetheid 3) vallen af.
  if (dislikes.includes('artificial_sweet') && flavor.sweetness === 3) return true;
  return false;
}

/**
 * Max. `limit` smaken uit één familie. Volgorde: past bij romig/fris → past bij zoetheid →
 * bestseller → volgorde in de catalogus. Liefst verschillende smaaknamen.
 */
export function suggestFlavors(
  family: FlavorFamily,
  profile: Pick<TasteProfile, 'texture' | 'sweetness' | 'excluded_flavors'>,
  rules: HardRuleInput,
  lines: ProductLine[],
  limit = 2,
): FlavorSuggestion[] {
  const candidates: (FlavorSuggestion & { rank: number[] })[] = [];
  lines.forEach((line, lineIndex) => {
    if (!TASTE_CATEGORIES.includes(line.category) || !isAllowed(line, rules)) return;
    for (const flavor of line.flavors) {
      if (flavor.family !== family || flavor.name === null || isDislikedFlavor(flavor, profile.excluded_flavors)) continue;
      candidates.push({
        line,
        flavor: flavor as FlavorSuggestion['flavor'],
        rank: [
          profile.texture && flavor.texture !== profile.texture ? 1 : 0,
          Math.abs(flavor.sweetness - profile.sweetness),
          line.badge === 'bestseller' ? 0 : 1,
          lineIndex,
        ],
      });
    }
  });
  candidates.sort((a, b) => a.rank.reduce((acc, v, i) => acc || v - b.rank[i], 0));

  const picked: FlavorSuggestion[] = [];
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (picked.some((p) => p.flavor.name === c.flavor.name)) continue;
    picked.push({ line: c.line, flavor: c.flavor });
  }
  // Te weinig verschillende namen? Vul aan met dezelfde smaak van een andere productlijn.
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.line.id === c.line.id && p.flavor.name === c.flavor.name)) picked.push({ line: c.line, flavor: c.flavor });
  }
  return picked;
}

/** "Whey Delicious Chocolade of Speculaas" / "Whey Delicious Chocolade of Perfect Whey Protein Chocolade" */
export function suggestionSentence(items: FlavorSuggestion[]): string | null {
  if (items.length === 0) return null;
  const [a, b] = items;
  if (!b) return `${a.line.name} ${a.flavor.name.toLowerCase()}`;
  if (a.line.id === b.line.id) return `${a.line.name} ${a.flavor.name.toLowerCase()} of ${b.flavor.name.toLowerCase()}`;
  return `${a.line.name} ${a.flavor.name.toLowerCase()} of ${b.line.name} ${b.flavor.name.toLowerCase()}`;
}
