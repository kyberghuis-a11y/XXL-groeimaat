import { describe, expect, it } from 'vitest';
import { getProductLines } from './catalog';
import { activeFilterCount, EMPTY_FILTERS, filterProducts, normalize, sortProducts, type CatalogFilters } from './filters';

const all = getProductLines();
const ids = (lines: { id: string }[]) => lines.map((l) => l.id);
const f = (patch: Partial<CatalogFilters>): CatalogFilters => ({ ...EMPTY_FILTERS, ...patch });

describe('filterProducts: afzonderlijke filters', () => {
  it('zonder filters: alles', () => {
    expect(filterProducts(all, EMPTY_FILTERS)).toHaveLength(all.length);
  });

  it('categorie', () => {
    expect(ids(filterProducts(all, f({ categories: ['Creatine'] })))).toEqual(['creatine-monohydraat']);
    expect(filterProducts(all, f({ categories: ['Whey-eiwit', 'Pre-workout'] }))).toHaveLength(4);
  });

  it('prijs (op vanaf-prijs)', () => {
    const tot20 = filterProducts(all, f({ priceRanges: ['tot-20'] }));
    expect(ids(tot20)).toContain('creatine-monohydraat'); // vanaf 8,99
    expect(ids(tot20)).toContain('whey-delicious'); // vanaf 19,99
    expect(ids(tot20)).not.toContain('whey-isolaat'); // vanaf 25,99
    expect(ids(filterProducts(all, f({ priceRanges: ['60-plus'] })))).toEqual([]);
    expect(ids(filterProducts(all, f({ priceRanges: ['40-60'] })))).toEqual(
      expect.arrayContaining(['whey-protein-zero', 'perfect-mass-gainer']),
    );
  });

  it('dieet: vegan', () => {
    expect(ids(filterProducts(all, f({ diets: ['vegan'] }))).sort()).toEqual(['creatine-monohydraat', 'green-protein']);
  });

  it('dieet: lactosevrij', () => {
    expect(ids(filterProducts(all, f({ diets: ['lactosevrij'] })))).toEqual(['whey-protein-zero']);
  });

  it('dieet: zonder cafeïne sluit Blast! uit, maar niet Blast! Caffeine Free', () => {
    const r = ids(filterProducts(all, f({ diets: ['zonder_cafeine'] })));
    expect(r).not.toContain('blast-pre-workout');
    expect(r).toContain('blast-pre-workout-caffeine-free');
    expect(r).toHaveLength(all.length - 1);
  });

  it('smaakfamilie: product telt mee als één van de smaken past', () => {
    const fris = ids(filterProducts(all, f({ flavorFamilies: ['fruitig_fris'] })));
    expect(fris).toEqual(expect.arrayContaining(['clear-whey-isolate', 'creatine-monohydraat', 'blast-pre-workout']));
    expect(fris).not.toContain('whey-delicious');
  });

  it('zoeken op naam, smaak en zonder hoofdletters/accenten', () => {
    expect(ids(filterProducts(all, f({ query: 'clear' })))).toEqual(['clear-whey-isolate']);
    expect(ids(filterProducts(all, f({ query: 'SPECULAAS' })))).toEqual(['whey-delicious']);
    expect(ids(filterProducts(all, f({ query: 'Caffeine' })))).toEqual(['blast-pre-workout-caffeine-free']);
    expect(filterProducts(all, f({ query: 'bestaatniet' }))).toEqual([]);
  });
});

describe('filterProducts: combinaties', () => {
  it('vegan + zonder cafeïne + tot €20', () => {
    expect(ids(filterProducts(all, f({ diets: ['vegan', 'zonder_cafeine'], priceRanges: ['tot-20'] })))).toEqual([
      'creatine-monohydraat',
    ]);
  });

  it('dieet is EN: vegan + lactosevrij geeft niets', () => {
    expect(filterProducts(all, f({ diets: ['vegan', 'lactosevrij'] }))).toEqual([]);
  });

  it('categorie + smaak + zoekterm', () => {
    expect(
      ids(filterProducts(all, f({ categories: ['Whey-eiwit'], flavorFamilies: ['koek'], query: 'perfect' }))),
    ).toEqual(['perfect-whey-protein']);
  });

  it('telt actieve filters (zoekterm telt niet mee)', () => {
    expect(activeFilterCount(f({ diets: ['vegan'], categories: ['Creatine', 'Pre-workout'], query: 'x' }))).toBe(3);
  });
});

describe('sortProducts', () => {
  it('populariteit: zonder reviews eerst bestsellers, daarna seedvolgorde', () => {
    const r = sortProducts(all, 'popular');
    expect(r[0].id).toBe('whey-delicious');
    expect(r).toHaveLength(all.length);
  });

  it('populariteit: meer reviews = hoger', () => {
    const [a, b] = all;
    const withReviews = [{ ...a, review_count: 10, badge: null }, { ...b, review_count: 500 }];
    expect(ids(sortProducts(withReviews, 'popular'))).toEqual([b.id, a.id]);
  });

  it('prijs laag–hoog op vanaf-prijs', () => {
    const r = sortProducts(all, 'price');
    expect(r[0].id).toBe('creatine-monohydraat');
    expect(r[r.length - 1].id).toBe('perfect-mass-gainer');
  });

  it('prijs per portie: onbekend achteraan', () => {
    const r = sortProducts(all, 'price_per_serving');
    expect(r[0].id).toBe('creatine-monohydraat');
    const unknown = ['green-protein', 'perfect-mass-gainer', 'cal-mag'];
    expect(ids(r.slice(-3)).sort()).toEqual(unknown.sort());
  });

  it('verandert de invoer niet', () => {
    const before = ids(all);
    sortProducts(all, 'price');
    expect(ids(all)).toEqual(before);
  });
});

describe('normalize', () => {
  it('haalt accenten en hoofdletters weg', () => {
    expect(normalize('  Cafeïne ')).toBe('cafeine');
  });
});
