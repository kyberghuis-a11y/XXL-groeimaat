import { describe, expect, it } from 'vitest';
import { getProductLine, getProductLines } from '../data/catalog';
import type { ProfileAnswers } from '../profile/types';
import type { TasteAnswers } from '../taste/questions';
import { buildTasteProfile } from '../taste/tasteProfile';
import {
  GOAL_PLANS,
  WEIGHTS,
  adviceCategory,
  budgetScore,
  candidateLines,
  explain,
  matchForLine,
  recommend,
  scoreVariants,
  tasteScore,
  usesPerMonth,
} from './engine';

const lines = getProductLines();
const ids = (xs: { line: { id: string } }[]) => xs.map((x) => x.line.id);

const P: ProfileAnswers = {
  is_adult: true,
  sport: 'strength',
  frequency: '3_4',
  goal: 'muscle',
  lifestyle: 'active_job',
  diet: [],
  usage_moment: 'post_workout',
  budget_range: '20_40',
  experience: 'some',
};
const T_ANSWERS: TasteAnswers = {
  dessert: 'chocolate_mousse',
  morning_drink: 'chocolate_milk',
  sweetness: 3,
  texture_pref: 'creamy',
  snack: 'cookie',
  mix_with: 'milk',
  dislikes: [],
};
const ROMIG = buildTasteProfile(T_ANSWERS)!; // chocolade 7, koek 4, vanille 2
const FRIS = buildTasteProfile({ ...T_ANSWERS, dessert: 'lemon_sorbet', morning_drink: 'juice', texture_pref: 'fresh', snack: 'fruit', mix_with: 'water' })!;

describe('stap A: doel → productlijnen (tabel uit de brief)', () => {
  it('basis en aanvullend per doel', () => {
    expect(GOAL_PLANS.muscle).toMatchObject({ base: ['whey-delicious', 'perfect-whey-protein', 'creatine-monohydraat'], extra: ['perfect-mass-gainer'] });
    expect(GOAL_PLANS.weight_loss).toMatchObject({ base: ['whey-isolaat', 'clear-whey-isolate'], extra: ['diet-shake', 'vitamine-d3'] });
    expect(GOAL_PLANS.endurance.base).toEqual(['clear-whey-isolate', 'whey-delicious']);
    expect(GOAL_PLANS.recovery).toMatchObject({ base: ['whey-delicious', 'creatine-monohydraat'], extra: ['cal-mag', 'omega-3-ultra-pure'] });
    expect(GOAL_PLANS.general_fitness).toMatchObject({ base: ['whey-delicious'], extra: ['vitamine-d3', 'delicious-protein-wafer'] });
  });

  it('alle ids in de plannen bestaan in de catalogus', () => {
    for (const plan of Object.values(GOAL_PLANS))
      for (const id of [...plan.base, ...plan.extra, ...plan.avoid]) expect(getProductLine(id), id).toBeDefined();
  });

  it('pre-workout wordt nooit aangeraden aan beginners', () => {
    for (const goal of Object.keys(GOAL_PLANS) as ProfileAnswers['goal'][])
      expect(ids(candidateLines(lines, { ...P, goal }))).not.toContain('blast-pre-workout');
  });

  it('vegan: whey valt weg, Green Protein wordt de basis (+ creatine)', () => {
    const c = candidateLines(lines, { ...P, diet: ['vegan'] });
    expect(ids(c)).toEqual(['creatine-monohydraat', 'green-protein']);
    expect(c.find((x) => x.line.id === 'green-protein')!.role).toBe('base');
  });

  it('lactosevrij: Whey Protein Zero en Whey Isolaat in plaats van Whey Delicious', () => {
    const c = ids(candidateLines(lines, { ...P, diet: ['lactose_free'] }));
    expect(c).toEqual(expect.arrayContaining(['whey-protein-zero', 'whey-isolaat', 'creatine-monohydraat']));
    expect(c).not.toContain('whey-delicious');
    expect(c).not.toContain('green-protein');
  });

  it('leefstijl: zittend → geen Mass Gainer; onderweg → Protein Wafer', () => {
    expect(ids(candidateLines(lines, { ...P, lifestyle: 'sedentary' }))).not.toContain('perfect-mass-gainer');
    expect(ids(candidateLines(lines, { ...P, lifestyle: 'active_job' }))).toContain('perfect-mass-gainer');
    expect(ids(candidateLines(lines, { ...P, lifestyle: 'on_the_go' }))).toContain('delicious-protein-wafer');
  });
});

describe('stap B: onderdelen van de score', () => {
  it('gewichten tellen op tot 100%', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('budget: binnen = 100, tot 20% erboven = 50, daarboven = 0, onbekend = 50', () => {
    expect(budgetScore(40, '20_40')).toBe(100);
    expect(budgetScore(48, '20_40')).toBe(50);
    expect(budgetScore(48.01, '20_40')).toBe(0);
    expect(budgetScore(500, 'over_60')).toBe(100);
    expect(budgetScore(null, '20_40')).toBe(50);
  });

  it('gebruik per maand: shakes per training, creatine en vitamines dagelijks', () => {
    const wd = getProductLine('whey-delicious')!;
    expect(usesPerMonth(wd, { ...P, frequency: '1_2' })).toBe(6);
    expect(usesPerMonth(wd, { ...P, frequency: '5_plus' })).toBe(24);
    expect(usesPerMonth(wd, { ...P, usage_moment: 'breakfast' })).toBe(30);
    expect(usesPerMonth(getProductLine('creatine-monohydraat')!, P)).toBe(30);
    expect(usesPerMonth(getProductLine('vitamine-d3')!, P)).toBe(30);
  });

  it('smaak: familiescore × 10; uitgesloten smaak valt af; geen smaak = 50', () => {
    const choc = { name: 'Chocolade', family: 'chocolade' as const, sweetness: 2 as const, texture: 'romig' as const };
    expect(tasteScore(choc, ROMIG)).toBe(70);
    expect(tasteScore(choc, { ...ROMIG, excluded_flavors: ['chocolate'] })).toBeNull();
    expect(tasteScore({ ...choc, name: 'Banaan', family: 'fruitig_zoet' }, { ...ROMIG, excluded_flavors: ['banana'] })).toBeNull();
    expect(tasteScore({ ...choc, name: null }, ROMIG)).toBe(50);
  });

  it('score = gewogen som, afgerond (Whey Delicious chocolade)', () => {
    const [best] = scoreVariants({ line: getProductLine('whey-delicious')!, role: 'base' }, P, ROMIG);
    expect(best.flavor.name).toBe('Chocolade');
    // 70×0,35 + 100×0,25 + 100×0,20 + 100×0,10 + 70×0,10 = 86,5 → 87
    expect(best.parts).toEqual({ taste: 70, goal: 100, budget: 100, diet: 100, lifestyle: 70 });
    expect(best.score).toBe(87);
  });

  it('formaat: beginners het kleinste, ervaren gebruikers het voordeligste per portie', () => {
    const wd = { line: getProductLine('whey-delicious')!, role: 'base' as const };
    expect(scoreVariants(wd, { ...P, experience: 'none' }, ROMIG)[0].size.label).toBe('450 g');
    expect(scoreVariants(wd, { ...P, experience: 'yes' }, ROMIG)[0].size.label).toBe('2500 g');
    expect(scoreVariants(wd, { ...P, experience: 'yes', budget_range: 'under_20' }, ROMIG)[0].size.label).toBe('450 g');
    expect(scoreVariants(wd, { ...P, experience: 'yes', goal: 'general_fitness' }, ROMIG)[0].size.label).toBe('450 g');
  });
});

describe('advies: per categorie de top 3 met labels', () => {
  it('spiermassa, romig: Whey Delicious chocolade bovenaan met de juiste labels', () => {
    const groups = recommend(lines, { ...P, experience: 'none' }, ROMIG);
    expect(groups.map((g) => g.category)).toEqual(['Eiwitshake', 'Creatine', 'Extra']);
    const shakes = groups[0].items;
    expect(shakes[0]).toMatchObject({ line: { id: 'whey-delicious' }, flavor: { name: 'Chocolade' } });
    expect(shakes[0].labels).toEqual(['Beste match voor jou', 'Bestseller']);
    expect(shakes.find((r) => r.labels.includes('Voordeligst per portie'))!.line.id).toBe('perfect-whey-protein');
    for (const g of groups) expect(g.items.length).toBeLessThanOrEqual(3);
  });

  it('elke categorie gesorteerd op score, en elke kaart heeft een uitleg', () => {
    for (const g of recommend(lines, P, FRIS)) {
      const scores = g.items.map((r) => r.score);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
      for (const r of g.items) expect(r.reason).toMatch(/^Past bij jou omdat .+\./);
    }
  });

  it('budget tot €20: maximaal 1 basisproduct, kleinste formaat', () => {
    const groups = recommend(lines, { ...P, budget_range: 'under_20' }, ROMIG);
    const base = groups.flatMap((g) => g.items).filter((r) => r.role === 'base');
    expect(base).toHaveLength(1);
    expect(base[0].size.label).toBe(base[0].line.sizes.map((s) => s).sort((a, b) => a.price_eur - b.price_eur)[0].label);
  });

  it('onder de 18: nooit iets met cafeïne', () => {
    for (const goal of Object.keys(GOAL_PLANS) as ProfileAnswers['goal'][]) {
      const items = recommend(lines, { ...P, goal, is_adult: false }, FRIS).flatMap((g) => g.items);
      expect(items.every((r) => !r.line.labels.includes('bevat_cafeine'))).toBe(true);
    }
  });

  it('uitgesloten smaken komen nooit in het advies', () => {
    const noChoc = buildTasteProfile({ ...T_ANSWERS, dislikes: ['chocolate'] })!;
    const items = recommend(lines, P, noChoc).flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((r) => r.flavor.family !== 'chocolade')).toBe(true);
  });

  it('vegan + lust geen banaan: geen advies (Green Protein heeft alleen banaan) → lege lijst', () => {
    const t = buildTasteProfile({ ...T_ANSWERS, dislikes: ['banana'] })!;
    const items = recommend(lines, { ...P, goal: 'endurance', diet: ['vegan'] }, t).flatMap((g) => g.items);
    expect(items).toEqual([]);
  });

  it('niet compleet → geen advies', () => {
    expect(recommend(lines, { ...P, goal: null }, ROMIG)).toEqual([]);
    expect(recommend(lines, P, null)).toEqual([]);
  });
});

describe('uitleg "Past bij jou omdat…"', () => {
  const item = (p: ProfileAnswers, id: string, taste = ROMIG) => recommend(lines, p, taste).flatMap((g) => g.items).find((r) => r.line.id === id)!;

  it('noemt doel en smaak, in correcte Nederlandse zinsbouw', () => {
    expect(item(P, 'whey-delicious').reason).toMatch(/^Past bij jou omdat het bij je doel past \(spiermassa opbouwen\) en chocolade bij jouw smaak past\./);
  });
  it('beginners: kleinste formaat', () => {
    expect(item({ ...P, experience: 'none' }, 'whey-delicious').reason).toMatch(/kleinste formaat/);
  });
  it('waarschuwt als het boven budget ligt', () => {
    const r = item({ ...P, budget_range: 'under_20', usage_moment: 'breakfast', experience: 'yes' }, 'whey-delicious');
    expect(r.reason).toMatch(/boven je budget van tot €20/);
  });
  it('onbekende prijs per portie: eerlijk benoemd, geen budgetwaarschuwing', () => {
    const r = item({ ...P, goal: 'recovery', budget_range: 'over_60' }, 'cal-mag');
    expect(r.reason).toMatch(/prijs per portie is nog niet bekend/);
    expect(r.reason).not.toMatch(/budget/);
  });
  it('geen gezondheidsclaims', () => {
    const all = (['muscle', 'weight_loss', 'endurance', 'recovery', 'general_fitness'] as const)
      .flatMap((goal) => recommend(lines, { ...P, goal, lifestyle: 'on_the_go' }, FRIS).flatMap((g) => g.items.map((r) => r.reason)))
      .join(' ');
    expect(all).not.toMatch(/spiergroei|spieren groeien|vetverbranding|geneest|gezonder/i);
  });
  it('explain is ook los te gebruiken', () => {
    const [v] = scoreVariants({ line: getProductLine('omega-3-ultra-pure')!, role: 'extra' }, P, ROMIG);
    expect(explain(v, P, ROMIG)).toMatch(/handige aanvulling is bij je doel/);
  });
});

describe('match-percentage (catalogus en productpagina)', () => {
  it('product in je advies: zelfde score; ook per smaak', () => {
    const m = matchForLine(getProductLine('whey-delicious')!, lines, P, ROMIG);
    expect(m.status).toBe('match');
    if (m.status === 'match') {
      expect(m.score).toBe(87);
      expect(m.byFlavor.get('Chocolade')).toBe(87);
      expect(m.byFlavor.get('Banaan')!).toBeLessThan(87);
    }
  });
  it('product buiten je doel: lagere score (doel telt 0)', () => {
    const m = matchForLine(getProductLine('clear-whey-isolate')!, lines, P, ROMIG);
    expect(m.status === 'match' && m.score < 60).toBe(true);
  });
  it('geblokkeerd: met reden', () => {
    expect(matchForLine(getProductLine('blast-pre-workout')!, lines, { ...P, is_adult: false }, ROMIG)).toEqual({ status: 'blocked', reason: 'Bevat cafeïne (alleen 18+)' });
    expect(matchForLine(getProductLine('whey-delicious')!, lines, { ...P, diet: ['vegan'] }, ROMIG)).toMatchObject({ status: 'blocked' });
  });
  it('alle bekende smaken uitgesloten: disliked', () => {
    const t = buildTasteProfile({ ...T_ANSWERS, dislikes: ['banana'] })!;
    expect(matchForLine(getProductLine('green-protein')!, lines, P, t)).toEqual({ status: 'disliked' });
  });
  it('categorie-indeling', () => {
    expect(adviceCategory(getProductLine('clear-whey-isolate')!)).toBe('Eiwitshake');
    expect(adviceCategory(getProductLine('creatine-monohydraat')!)).toBe('Creatine');
    expect(adviceCategory(getProductLine('vitamine-d3')!)).toBe('Extra');
  });
});
