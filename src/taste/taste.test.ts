import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from '../auth/demoAuth';
import { getProductLine, getProductLines } from '../data/catalog';
import { NONE, firstOpenQuestion, toggleMulti } from '../lib/questionFlow';
import { blockedReason } from '../recommend/rules';
import { EMPTY_TASTE_ANSWERS, TASTE_QUESTIONS, type TasteAnswers } from './questions';
import { isDislikedFlavor, suggestFlavors, suggestionSentence } from './suggestions';
import { buildTasteProfile, excludedFamilies, personaTitle, rankFamilies, rawScores, topFamilies } from './tasteProfile';
import { clearDemoTaste, createDemoTasteService, toTasteRow } from './tasteService';

const memoryStorage = (): KeyValueStorage => {
  const d: Record<string, string> = {};
  return { getItem: (k) => d[k] ?? null, setItem: (k, v) => void (d[k] = v), removeItem: (k) => void delete d[k] };
};

// Neutraal antwoord: geeft nergens punten.
const BASE: TasteAnswers = {
  dessert: 'vanilla_custard',
  morning_drink: 'coffee',
  sweetness: 2,
  texture_pref: 'no_preference',
  snack: 'nothing',
  mix_with: 'milk',
  dislikes: [],
};
const ADULT = { is_adult: true, diet: [] as never[] };

describe('vragenlijst', () => {
  it('7 vragen uit de brief, alleen de laatste is meerkeuze', () => {
    expect(TASTE_QUESTIONS.map((q) => q.key)).toEqual(['dessert', 'morning_drink', 'sweetness', 'texture_pref', 'snack', 'mix_with', 'dislikes']);
    expect(TASTE_QUESTIONS.filter((q) => q.multi).map((q) => q.key)).toEqual(['dislikes']);
  });
  it('firstOpenQuestion en toggleMulti (gedeeld met de profielvragen)', () => {
    expect(firstOpenQuestion(TASTE_QUESTIONS, EMPTY_TASTE_ANSWERS as unknown as Record<string, unknown>)).toBe(1);
    expect(firstOpenQuestion(TASTE_QUESTIONS, { ...BASE, dislikes: null } as unknown as Record<string, unknown>)).toBe(7);
    expect(firstOpenQuestion(TASTE_QUESTIONS, BASE as unknown as Record<string, unknown>)).toBeNull();
    expect(toggleMulti(['banana'], NONE, false)).toEqual({ values: [], none: true });
  });
});

describe('punten per vraag (tabel "Effect op profiel" uit de brief)', () => {
  const only = (patch: Partial<TasteAnswers>) => rawScores({ ...BASE, dessert: null, ...patch });

  it('1. toetje: +3 op de bijbehorende familie', () => {
    expect(only({ dessert: 'chocolate_mousse' }).chocolade).toBe(3);
    expect(only({ dessert: 'vanilla_custard' }).vanille).toBe(3);
    expect(only({ dessert: 'strawberry_ice' }).fruitig_zoet).toBe(3);
    expect(only({ dessert: 'lemon_sorbet' }).fruitig_fris).toBe(3);
    expect(only({ dessert: 'speculaas' }).koek).toBe(3);
    expect(only({ dessert: 'caramel' }).koek).toBe(3);
  });
  it('2. ochtenddrank: sap +2 fruitig fris, chocomel +2 chocolade, rest niets', () => {
    expect(only({ morning_drink: 'juice' }).fruitig_fris).toBe(2);
    expect(only({ morning_drink: 'chocolate_milk' }).chocolade).toBe(2);
    expect(Object.values(only({ morning_drink: 'tea' })).every((v) => v === 0)).toBe(true);
  });
  it('4. romig +2 op chocolade, vanille, koek; fris +2 op fruitig fris', () => {
    expect(only({ texture_pref: 'creamy' })).toMatchObject({ chocolade: 2, vanille: 2, koek: 2, fruitig_fris: 0 });
    expect(only({ texture_pref: 'fresh' })).toMatchObject({ fruitig_fris: 2, chocolade: 0 });
  });
  it('5. snack: koekje +2 koek, fruit +2 fruitig, reep +2 chocolade', () => {
    expect(only({ snack: 'cookie' }).koek).toBe(2);
    expect(only({ snack: 'fruit' })).toMatchObject({ fruitig_zoet: 2, fruitig_fris: 2 });
    expect(only({ snack: 'chocolate_bar' }).chocolade).toBe(2);
    expect(Object.values(only({ snack: 'crisps' })).every((v) => v === 0)).toBe(true);
  });
  it('6. mengen: water = frisse bonus; kwark/havermout = vanille + koek', () => {
    expect(only({ mix_with: 'water' }).fruitig_fris).toBe(2);
    expect(only({ mix_with: 'quark_oats' })).toMatchObject({ vanille: 2, koek: 2 });
  });
});

describe('smaakprofiel', () => {
  it('null zolang niet alles is beantwoord', () => {
    expect(buildTasteProfile({ ...BASE, snack: null })).toBeNull();
  });

  it('voorbeeld uit de brief: romige zoetekauw → chocolade en koek bovenaan', () => {
    const p = buildTasteProfile({ ...BASE, dessert: 'chocolate_mousse', morning_drink: 'chocolate_milk', sweetness: 3, texture_pref: 'creamy', snack: 'cookie' })!;
    expect(p.scores).toMatchObject({ chocolade: 7, koek: 4, vanille: 2 });
    expect(p.top_families).toEqual(['chocolade', 'koek', 'vanille']);
    expect(p.texture).toBe('romig');
    expect(personaTitle(p)).toBe('Jij bent een romige zoetekauw');
  });

  it('scores blijven tussen 0 en 10', () => {
    const p = buildTasteProfile({ ...BASE, dessert: 'lemon_sorbet', morning_drink: 'juice', texture_pref: 'fresh', snack: 'fruit', mix_with: 'water' })!;
    expect(p.scores.fruitig_fris).toBe(10); // ruw 11, afgekapt op 10
    for (const v of Object.values(p.scores)) expect(v).toBeGreaterThanOrEqual(0);
  });

  it('uitgesloten families: score 0 en nooit in de top 3', () => {
    expect(excludedFamilies(['chocolate', 'fruity'])).toEqual(['chocolade', 'fruitig_zoet', 'fruitig_fris']);
    const p = buildTasteProfile({ ...BASE, dessert: 'chocolate_mousse', snack: 'chocolate_bar', dislikes: ['chocolate'] })!;
    expect(p.scores.chocolade).toBe(0);
    expect(p.top_families).not.toContain('chocolade');
  });

  it('gelijke scores: chocolade en vanille eerst (veiligste startkeuze)', () => {
    const zero = { chocolade: 0, vanille: 0, koek: 0, fruitig_zoet: 0, fruitig_fris: 0, neutraal: 0 };
    expect(rankFamilies(zero).slice(0, 3)).toEqual(['chocolade', 'vanille', 'koek']);
    expect(rankFamilies(zero, ['chocolade']).slice(0, 2)).toEqual(['vanille', 'koek']);
  });

  it('top 3 bevat geen families met 0 punten', () => {
    const p = buildTasteProfile({ ...BASE, dessert: 'lemon_sorbet', snack: 'fruit' })!;
    expect(p.top_families).toEqual(['fruitig_fris', 'fruitig_zoet']);
  });

  it('nergens punten: veiligste startkeuze chocolade en vanille', () => {
    const p = buildTasteProfile({ ...BASE, dessert: 'caramel', dislikes: [] })!;
    expect(p.top_families[0]).toBe('koek');
    const none = buildTasteProfile({ ...BASE, dessert: null as never, dislikes: [] });
    expect(none).toBeNull();
    expect(topFamilies({ chocolade: 0, vanille: 0, koek: 0, fruitig_zoet: 0, fruitig_fris: 0, neutraal: 0 })).toEqual(['chocolade', 'vanille']);
    expect(topFamilies({ chocolade: 0, vanille: 0, koek: 0, fruitig_zoet: 0, fruitig_fris: 0, neutraal: 0 }, ['chocolade'])).toEqual(['vanille', 'koek']);
  });

  it('typering voor elke combinatie van zoetheid en textuur', () => {
    const titles = [1, 2, 3].flatMap((s) => (['romig', 'fris', null] as const).map((t) => personaTitle({ sweetness: s as 1 | 2 | 3, texture: t })));
    expect(new Set(titles).size).toBe(9);
    expect(titles.every((t) => t.startsWith('Jij '))).toBe(true);
  });
});

describe('harde regels (brief)', () => {
  const line = (id: string) => getProductLine(id)!;
  it('onder 18 of niet bevestigd: geen cafeïne', () => {
    expect(blockedReason(line('blast-pre-workout'), { is_adult: false, diet: [] })).toMatch(/cafeïne/);
    expect(blockedReason(line('blast-pre-workout'), { is_adult: null, diet: [] })).toMatch(/cafeïne/);
    expect(blockedReason(line('blast-pre-workout'), ADULT)).toBeNull();
    expect(blockedReason(line('blast-pre-workout-caffeine-free'), { is_adult: false, diet: [] })).toBeNull();
  });
  it('veganistisch: alleen Green Protein en Creatine (van de eiwitten en creatine)', () => {
    const ok = getProductLines().filter((l) => !blockedReason(l, { is_adult: true, diet: ['vegan'] })).map((l) => l.id);
    expect(ok).toEqual(['green-protein', 'creatine-monohydraat']);
  });
  it('lactosevrij: Whey Protein Zero en Whey Isolaat wel, Whey Delicious niet', () => {
    const p = { is_adult: true, diet: ['lactose_free' as const] };
    expect(blockedReason(line('whey-protein-zero'), p)).toBeNull();
    expect(blockedReason(line('whey-isolaat'), p)).toBeNull();
    expect(blockedReason(line('whey-delicious'), p)).toMatch(/lactose/);
    expect(blockedReason(line('creatine-monohydraat'), p)).toBeNull();
  });
});

describe('vertalen naar XXL-smaken', () => {
  const lines = getProductLines();
  const prof = (patch: Partial<{ texture: 'romig' | 'fris' | null; sweetness: 1 | 2 | 3; excluded_flavors: TasteAnswers['dislikes'] & object }> = {}) => ({
    texture: 'romig' as const,
    sweetness: 3 as const,
    excluded_flavors: [],
    ...patch,
  });

  it('chocolade/koek voor een romige zoetekauw: Whey Delicious eerst (bestseller)', () => {
    const choc = suggestFlavors('chocolade', prof(), ADULT, lines);
    const koek = suggestFlavors('koek', prof(), ADULT, lines);
    expect(choc[0].line.id).toBe('whey-delicious');
    expect(koek[0].line.id).toBe('whey-delicious');
    expect(suggestionSentence([choc[0], koek[0]])).toMatch(/^Whey Delicious chocolade of (speculaas|salted caramel)$/);
  });

  it('fruitig fris → Clear Whey; geen pre-workout of wafels als smaaksuggestie', () => {
    const s = suggestFlavors('fruitig_fris', prof({ texture: 'fris', sweetness: 2 }), ADULT, lines, 5);
    expect(s[0].line.id).toBe('clear-whey-isolate');
    expect(s.every((x) => !['blast-pre-workout', 'delicious-protein-wafer'].includes(x.line.id))).toBe(true);
  });

  it('vegan: alleen smaken van vegan producten', () => {
    const s = suggestFlavors('fruitig_zoet', prof(), { is_adult: true, diet: ['vegan'] }, lines, 5);
    expect(s.map((x) => x.line.id)).toEqual(['green-protein']);
    expect(suggestFlavors('chocolade', prof(), { is_adult: true, diet: ['vegan'] }, lines)).toEqual([]);
  });

  it('banaan uitgesloten: ook Aardbei-Banaan valt af', () => {
    const s = suggestFlavors('fruitig_zoet', prof({ excluded_flavors: ['banana'] }), ADULT, lines, 20);
    expect(s.length).toBeGreaterThan(0);
    expect(s.some((x) => /banaan/i.test(x.flavor.name))).toBe(false);
  });

  it('kunstmatig zoet: de zoetste smaken (zoetheid 3) vallen af', () => {
    expect(isDislikedFlavor({ name: 'Speculaas', family: 'koek', sweetness: 3, texture: 'romig' }, ['artificial_sweet'])).toBe(true);
    expect(isDislikedFlavor({ name: 'Chocolade', family: 'chocolade', sweetness: 2, texture: 'romig' }, ['artificial_sweet'])).toBe(false);
  });

  it('liefst twee verschillende smaaknamen', () => {
    const s = suggestFlavors('vanille', prof({ sweetness: 2 }), ADULT, lines);
    expect(s).toHaveLength(2);
    expect(s[0].flavor.name).not.toBe(s[1].flavor.name);
  });
});

describe('opslag', () => {
  it('demo: per gebruiker, stapsgewijs, en wissen bij account verwijderen', async () => {
    const storage = memoryStorage();
    const svc = createDemoTasteService(storage);
    await svc.save('u1', { dessert: 'speculaas' });
    await svc.save('u1', { sweetness: 3 });
    expect(await svc.load('u1')).toMatchObject({ dessert: 'speculaas', sweetness: 3, snack: null });
    clearDemoTaste(storage, 'u1');
    expect(await svc.load('u1')).toEqual(EMPTY_TASTE_ANSWERS);
  });

  it('rij voor Supabase: berekende kolommen pas als alles is ingevuld', () => {
    expect(toTasteRow('u1', { ...BASE, snack: null })).toMatchObject({ user_id: 'u1', scores: null, sweetness: null });
    const row = toTasteRow('u1', { ...BASE, texture_pref: 'fresh', dislikes: ['banana'] });
    expect(row).toMatchObject({ sweetness: 2, texture: 'fris', mix_with: 'milk', excluded_flavors: ['banana'] });
    expect(Object.keys(row.scores!)).toHaveLength(6);
  });

  it('SQL-migratie kent alle codes die de code opslaat', () => {
    const sql = readFileSync(new URL('../../supabase/migrations/0003_taste_profiles.sql', import.meta.url), 'utf8');
    for (const v of ['water', 'milk', 'plant_milk', 'quark_oats', 'banana', 'artificial_sweet', 'chocolate', 'fruity', 'romig', 'fris'])
      expect(sql, v).toContain(`'${v}'`);
  });
});

describe('beginnerstips', () => {
  it('noemen alleen producten die bij voeding en leeftijd passen', async () => {
    const { beginnerTips } = await import('../pages/TasteScreens');
    const all = beginnerTips('water', { is_adult: true, diet: [] }).join(' ');
    expect(all).toMatch(/Whey Delicious 450 g/);
    expect(all).toMatch(/Clear Whey/);
    const vegan = beginnerTips('water', { is_adult: true, diet: ['vegan'] }).join(' ');
    expect(vegan).not.toMatch(/Whey Delicious|Clear Whey/);
    expect(beginnerTips('milk', { is_adult: true, diet: [] }).join(' ')).not.toMatch(/Clear Whey/);
  });
});
