// De vragen van onboarding stap 2, in volgorde. Eén vraag per scherm.
import {
  BUDGET_RANGES,
  DIETS,
  EXPERIENCES,
  FREQUENCIES,
  GOALS,
  LIFESTYLES,
  SPORTS,
  USAGE_MOMENTS,
  type AnswerKey,
  type Diet,
  type ProfileAnswers,
} from './types';

import { NONE, toggleMulti, type FlowQuestion } from '../lib/questionFlow';

export { NONE };

interface Option<V = string> {
  value: V;
  label: string;
}

export interface Question extends FlowQuestion {
  key: AnswerKey;
  options: Option<string | boolean>[];
}

const opts = <V extends string>(values: readonly V[], labels: Record<V, string>): Option<V>[] =>
  values.map((value) => ({ value, label: labels[value] }));


export const QUESTIONS: Question[] = [
  {
    key: 'is_adult',
    topic: 'Leeftijd',
    title: 'Ben je 18 jaar of ouder?',
    help: 'Onder de 18 geven we geen advies voor producten met cafeïne, zoals pre-workout.',
    options: [
      { value: true, label: 'Ja, ik ben 18 jaar of ouder' },
      { value: false, label: 'Nee, ik ben jonger dan 18' },
    ],
  },
  {
    key: 'sport',
    topic: 'Sport',
    title: 'Welke sport doe je vooral?',
    options: opts(SPORTS, {
      strength: 'Fitness / kracht',
      running: 'Hardlopen',
      team_sports: 'Voetbal / teamsport',
      combat: 'Vechtsport',
      crossfit: 'CrossFit',
      cycling: 'Wielrennen',
      other: 'Anders',
    }),
  },
  {
    key: 'frequency',
    topic: 'Frequentie',
    title: 'Hoe vaak train je per week?',
    options: opts(FREQUENCIES, { '1_2': '1–2 keer', '3_4': '3–4 keer', '5_plus': '5 keer of meer' }),
  },
  {
    key: 'goal',
    topic: 'Doel',
    title: 'Wat is je belangrijkste doel?',
    options: opts(GOALS, {
      muscle: 'Spiermassa opbouwen',
      weight_loss: 'Afvallen / droogtrainen',
      endurance: 'Uithoudingsvermogen',
      recovery: 'Sneller herstellen',
      general_fitness: 'Algemeen fit',
    }),
  },
  {
    key: 'lifestyle',
    topic: 'Leefstijl',
    title: 'Hoe ziet je dag eruit?',
    options: opts(LIFESTYLES, {
      sedentary: 'Zittend werk of studie',
      active_job: 'Actief werk',
      on_the_go: 'Veel onderweg',
    }),
  },
  {
    key: 'diet',
    topic: 'Voeding',
    title: 'Volg je een voedingspatroon?',
    help: 'Je kunt meer dan één antwoord kiezen.',
    multi: true,
    options: [
      { value: NONE, label: 'Geen' },
      ...opts(DIETS, {
        vegetarian: 'Vegetarisch',
        vegan: 'Veganistisch',
        lactose_free: 'Lactosevrij',
        gluten_free: 'Glutenvrij',
        halal: 'Halal',
      }),
    ],
  },
  {
    key: 'usage_moment',
    topic: 'Gebruik',
    title: 'Wanneer zou je een shake drinken?',
    options: opts(USAGE_MOMENTS, {
      post_workout: 'Na de training',
      breakfast: 'Als ontbijt',
      snack: 'Als snack',
      unknown: 'Weet ik niet',
    }),
  },
  {
    key: 'budget_range',
    topic: 'Budget',
    title: 'Hoeveel wil je per maand uitgeven?',
    options: opts(BUDGET_RANGES, {
      under_20: 'Tot €20',
      '20_40': '€20–€40',
      '40_60': '€40–€60',
      over_60: 'Meer dan €60',
    }),
  },
  {
    key: 'experience',
    topic: 'Ervaring',
    title: 'Heb je al eerder supplementen gebruikt?',
    options: opts(EXPERIENCES, { none: 'Nee', some: 'Een beetje', yes: 'Ja' }),
  },
];

export function isAnswered(answers: ProfileAnswers, key: AnswerKey): boolean {
  return answers[key] !== null;
}

/** Nummer (1-based) van de eerste onbeantwoorde vraag, of null als alles is ingevuld. */
export function firstUnanswered(answers: ProfileAnswers): number | null {
  const i = QUESTIONS.findIndex((q) => !isAnswered(answers, q.key));
  return i === -1 ? null : i + 1;
}

export function isProfileComplete(answers: ProfileAnswers): boolean {
  return firstUnanswered(answers) === null;
}

/** Voeding: "Geen" sluit de rest uit, en een dieet kiezen haalt "Geen" weg. */
export function toggleDiet(current: Diet[] | null, value: Diet | typeof NONE, noneSelected: boolean): { diet: Diet[]; none: boolean } {
  const t = toggleMulti(current ?? [], value, noneSelected);
  return { diet: t.values, none: t.none };
}

/** Label van een antwoord, voor het overzicht. */
export function answerLabel(question: Question, answers: ProfileAnswers): string {
  const value = answers[question.key];
  if (value === null) return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Geen';
    return value.map((v) => question.options.find((o) => o.value === v)?.label ?? v).join(', ');
  }
  return question.options.find((o) => o.value === value)?.label ?? String(value);
}
