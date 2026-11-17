// Profielvragen uit de projectbrief (sectie "Profiel & onboarding").
// Codes in het Engels (code/database), labels in het Nederlands (app).

export const SPORTS = ['strength', 'running', 'team_sports', 'combat', 'crossfit', 'cycling', 'other'] as const;
export const FREQUENCIES = ['1_2', '3_4', '5_plus'] as const;
export const GOALS = ['muscle', 'weight_loss', 'endurance', 'recovery', 'general_fitness'] as const;
export const LIFESTYLES = ['sedentary', 'active_job', 'on_the_go'] as const;
export const DIETS = ['vegetarian', 'vegan', 'lactose_free', 'gluten_free', 'halal'] as const;
export const USAGE_MOMENTS = ['post_workout', 'breakfast', 'snack', 'unknown'] as const;
export const BUDGET_RANGES = ['under_20', '20_40', '40_60', 'over_60'] as const;
export const EXPERIENCES = ['none', 'some', 'yes'] as const;

export type Sport = (typeof SPORTS)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type Goal = (typeof GOALS)[number];
export type Lifestyle = (typeof LIFESTYLES)[number];
export type Diet = (typeof DIETS)[number];
export type UsageMoment = (typeof USAGE_MOMENTS)[number];
export type BudgetRange = (typeof BUDGET_RANGES)[number];
export type Experience = (typeof EXPERIENCES)[number];

/**
 * Alle antwoorden uit de onboarding. `null` = nog niet beantwoord.
 * `diet: []` betekent "Geen" (wel beantwoord). `is_adult` wordt opgeslagen in de tabel users,
 * de rest in de tabel profiles.
 */
export interface ProfileAnswers {
  is_adult: boolean | null;
  sport: Sport | null;
  frequency: Frequency | null;
  goal: Goal | null;
  lifestyle: Lifestyle | null;
  diet: Diet[] | null;
  usage_moment: UsageMoment | null;
  budget_range: BudgetRange | null;
  experience: Experience | null;
}

export type AnswerKey = keyof ProfileAnswers;

export const EMPTY_ANSWERS: ProfileAnswers = {
  is_adult: null,
  sport: null,
  frequency: null,
  goal: null,
  lifestyle: null,
  diet: null,
  usage_moment: null,
  budget_range: null,
  experience: null,
};
