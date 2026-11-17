// Smaakadvies: concrete XXL-smaken per familie, "Begin met …" en de beginnerstips uit de brief.
import { getProductLine, getProductLines } from '../data/catalog';
import type { FlavorFamily } from '../data/types';
import { useProfile } from '../profile/ProfileContext';
import { isAllowed, type HardRuleInput } from '../recommend/rules';
import { suggestFlavors, suggestionSentence, type FlavorSuggestion } from './suggestions';
import { rankFamilies, type TasteProfile } from './tasteProfile';

/** Concrete XXL-smaken per familie, rekening houdend met de harde regels (dieet, 18+). */
export function useFamilySuggestions(profile: TasteProfile | null): Record<FlavorFamily, FlavorSuggestion[]> | null {
  const { answers } = useProfile();
  if (!profile) return null;
  const lines = getProductLines();
  return Object.fromEntries(
    rankFamilies(profile.scores).map((f) => [f, suggestFlavors(f, profile, answers, lines)]),
  ) as Record<FlavorFamily, FlavorSuggestion[]>;
}

/** "Begin met …": de beste smaak uit je nummer 1 en nummer 2 familie. */
export function startAdvice(profile: TasteProfile, suggestions: Record<FlavorFamily, FlavorSuggestion[]>): string | null {
  const [first, second] = profile.top_families;
  const picks = [suggestions[first]?.[0], (second && suggestions[second]?.[0]) || suggestions[first]?.[1]].filter(
    (x): x is FlavorSuggestion => Boolean(x),
  );
  return suggestionSentence(picks);
}

/** Tips uit de brief; producten worden alleen genoemd als ze bij jouw voeding en leeftijd passen. */
export function beginnerTips(mixWith: TasteProfile['mix_with'], rules: HardRuleInput): string[] {
  const allowed = (id: string) => {
    const line = getProductLine(id);
    return Boolean(line && isAllowed(line, rules));
  };
  const tips = [
    allowed('whey-delicious')
      ? 'Twijfel je? Begin met het kleinste formaat (bijvoorbeeld Whey Delicious 450 g) of met samples.'
      : 'Twijfel je? Begin met het kleinste formaat of met samples.',
    'Chocolade en vanille zijn de veiligste smaken om mee te beginnen.',
  ];
  if (mixWith === 'water' && allowed('clear-whey-isolate'))
    tips.push('Drink je je shake met water? Dan vind je Clear Whey vaak lekkerder dan een romige whey.');
  return tips;
}

