// Harde regels uit de projectbrief (sectie "Aanbevelingslogica > Harde regels").
// Een productlijn die hier niet door komt, wordt NOOIT aanbevolen.
// Bouwstap 5 gebruikt dit voor de smaaksuggesties; bouwstap 6 voor de aanbevelingen.
import type { ProductLine } from '../data/types';
import type { ProfileAnswers } from '../profile/types';

export type HardRuleInput = Pick<ProfileAnswers, 'is_adult' | 'diet'>;

/** Waarom een productlijn afvalt (voor uitleg en tests), of null als hij mag. */
export function blockedReason(line: ProductLine, p: HardRuleInput): string | null {
  // Onder de 18 of geen leeftijdsbevestiging → geen cafeïnehoudende producten.
  if (p.is_adult !== true && line.labels.includes('bevat_cafeine')) return 'Bevat cafeïne (alleen 18+)';

  const diet = p.diet ?? [];
  // Veganistisch → alleen producten met het label vegan (Green Protein, Creatine).
  if (diet.includes('vegan') && !line.labels.includes('vegan')) return 'Niet vegan';
  // Lactosevrij → Whey Protein Zero of Whey Isolaat (volgens de brief); geen andere producten met melk.
  if (diet.includes('lactose_free')) {
    const ok = line.labels.includes('lactosevrij') || line.id === 'whey-isolaat' || !line.allergens.includes('melk');
    if (!ok) return 'Bevat lactose';
  }
  return null;
}

export function isAllowed(line: ProductLine, p: HardRuleInput): boolean {
  return blockedReason(line, p) === null;
}
