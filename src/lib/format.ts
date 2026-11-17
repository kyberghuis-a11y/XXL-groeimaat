const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** €19,99 */
export function formatEuro(value: number): string {
  return euro.format(value);
}

export const FLAVOR_FAMILY_LABELS = {
  chocolade: 'Chocolade',
  vanille: 'Vanille & romig',
  koek: 'Koek & dessert',
  fruitig_zoet: 'Fruitig zoet',
  fruitig_fris: 'Fruitig fris',
  neutraal: 'Neutraal / naturel',
} as const;

export const USP_MESSAGES = [
  'Vóór 22:00 besteld, vandaag verzonden',
  'Gratis goodies & samples vanaf €40',
  'Gratis verzending vanaf €100',
] as const;

export const DISCLAIMER =
  'Dit is geen medisch advies. Heb je een aandoening, gebruik je medicijnen of ben je zwanger? Overleg eerst met je huisarts of een diëtist.';

export const CONCEPT_LABEL = 'Concept, geen officiële app van XXL Nutrition';
