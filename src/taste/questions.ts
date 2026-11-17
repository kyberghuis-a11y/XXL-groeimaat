// Smaakvragenlijst uit de projectbrief (sectie "Smaakvragenlijst"): 7 vragen.
import { NONE, type FlowQuestion } from '../lib/questionFlow';

export const DESSERTS = ['chocolate_mousse', 'vanilla_custard', 'strawberry_ice', 'lemon_sorbet', 'speculaas', 'caramel'] as const;
export const MORNING_DRINKS = ['coffee', 'tea', 'juice', 'chocolate_milk', 'water'] as const;
export const TEXTURE_PREFS = ['creamy', 'fresh', 'no_preference'] as const;
export const SNACKS = ['cookie', 'fruit', 'crisps', 'chocolate_bar', 'nothing'] as const;
export const MIX_WITH = ['water', 'milk', 'plant_milk', 'quark_oats'] as const;
export const DISLIKES = ['banana', 'artificial_sweet', 'chocolate', 'fruity'] as const;

export type Dessert = (typeof DESSERTS)[number];
export type MorningDrink = (typeof MORNING_DRINKS)[number];
export type TexturePref = (typeof TEXTURE_PREFS)[number];
export type Snack = (typeof SNACKS)[number];
export type MixWith = (typeof MIX_WITH)[number];
export type Dislike = (typeof DISLIKES)[number];

/** Antwoorden op de smaaktest. `null` = nog niet beantwoord; `dislikes: []` = "Geen". */
export interface TasteAnswers {
  dessert: Dessert | null;
  morning_drink: MorningDrink | null;
  sweetness: 1 | 2 | 3 | null;
  texture_pref: TexturePref | null;
  snack: Snack | null;
  mix_with: MixWith | null;
  dislikes: Dislike[] | null;
}

export const EMPTY_TASTE_ANSWERS: TasteAnswers = {
  dessert: null,
  morning_drink: null,
  sweetness: null,
  texture_pref: null,
  snack: null,
  mix_with: null,
  dislikes: null,
};

export const TASTE_QUESTIONS: (FlowQuestion & { key: keyof TasteAnswers })[] = [
  {
    key: 'dessert',
    topic: 'Smaaktest',
    title: 'Welk toetje kies je?',
    options: [
      { value: 'chocolate_mousse', label: 'Chocolademousse' },
      { value: 'vanilla_custard', label: 'Vanillevla' },
      { value: 'strawberry_ice', label: 'Aardbeienijs' },
      { value: 'lemon_sorbet', label: 'Citroensorbet' },
      { value: 'speculaas', label: 'Speculaas' },
      { value: 'caramel', label: 'Karamel' },
    ],
  },
  {
    key: 'morning_drink',
    topic: 'Smaaktest',
    title: "Wat drink je 's ochtends?",
    options: [
      { value: 'coffee', label: 'Koffie' },
      { value: 'tea', label: 'Thee' },
      { value: 'juice', label: 'Sap' },
      { value: 'chocolate_milk', label: 'Chocomel' },
      { value: 'water', label: 'Water' },
    ],
  },
  {
    key: 'sweetness',
    topic: 'Smaaktest',
    title: 'Hoe zoet mag het zijn?',
    options: [
      { value: 1, label: 'Weinig' },
      { value: 2, label: 'Gemiddeld' },
      { value: 3, label: 'Heel zoet' },
    ],
  },
  {
    key: 'texture_pref',
    topic: 'Smaaktest',
    title: 'Romig of fris?',
    options: [
      { value: 'creamy', label: 'Romig en vol' },
      { value: 'fresh', label: 'Fris en licht' },
      { value: 'no_preference', label: 'Maakt niet uit' },
    ],
  },
  {
    key: 'snack',
    topic: 'Smaaktest',
    title: 'Welke snack pak je?',
    options: [
      { value: 'cookie', label: 'Koekje' },
      { value: 'fruit', label: 'Fruit' },
      { value: 'crisps', label: 'Chips' },
      { value: 'chocolate_bar', label: 'Reep' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  {
    key: 'mix_with',
    topic: 'Smaaktest',
    title: 'Waarmee meng je je shake?',
    options: [
      { value: 'water', label: 'Water' },
      { value: 'milk', label: 'Melk' },
      { value: 'plant_milk', label: 'Plantaardige melk' },
      { value: 'quark_oats', label: 'In kwark, yoghurt of havermout' },
    ],
  },
  {
    key: 'dislikes',
    topic: 'Smaaktest',
    title: 'Welke smaken lust je echt niet?',
    help: 'Je kunt meer dan één antwoord kiezen. Deze smaken raden we nooit aan.',
    multi: true,
    options: [
      { value: NONE, label: 'Geen, ik lust alles' },
      { value: 'banana', label: 'Banaan' },
      { value: 'artificial_sweet', label: 'Kunstmatig zoet' },
      { value: 'chocolate', label: 'Chocolade' },
      { value: 'fruity', label: 'Fruitig' },
    ],
  },
];
