import { describe, expect, it } from 'vitest';
import seed from './products.seed.json';
import { bestPricePerServing, expandVariants, fromPrice, getProductLine, getProductLines, pricePerServing } from './catalog';
import { CATEGORIES, FLAVOR_FAMILIES, LABELS } from './types';

describe('pricePerServing', () => {
  it('deelt prijs door porties en rondt af op centen', () => {
    expect(pricePerServing(39.99, 33)).toBe(1.21);
    expect(pricePerServing(8.99, 50)).toBe(0.18);
  });
  it('geeft null bij onbekende of ongeldige porties', () => {
    expect(pricePerServing(10, null)).toBeNull();
    expect(pricePerServing(10, 0)).toBeNull();
  });
});

describe('expandVariants', () => {
  it('maakt per smaak × formaat één variant met unieke id', () => {
    const wd = getProductLine('whey-delicious')!;
    const variants = expandVariants(wd);
    expect(variants).toHaveLength(wd.flavors.length * wd.sizes.length);
    expect(new Set(variants.map((v) => v.id)).size).toBe(variants.length);
    const v = variants.find((x) => x.flavor === 'Chocolade' && x.size_label === '1000 g')!;
    expect(v.price_per_serving).toBe(1.21);
    expect(v.flavor_family).toBe('chocolade');
  });
  it('erft needs_check van het formaat', () => {
    const wd = getProductLine('whey-delicious')!;
    const v450 = expandVariants(wd).find((x) => x.size_label === '450 g')!;
    expect(v450.needs_check).toBe(true);
  });
});

describe('fromPrice / bestPricePerServing', () => {
  it('pakt de laagste prijs en laagste prijs per portie', () => {
    const creatine = getProductLine('creatine-monohydraat')!;
    expect(fromPrice(creatine)).toBe(8.99);
    expect(bestPricePerServing(creatine)).toBe(0.09); // 1000 g: 17,99 / 200
  });
  it('geeft null als porties nergens bekend zijn', () => {
    expect(bestPricePerServing(getProductLine('cal-mag')!)).toBeNull();
  });
});

describe('seedbestand (validatie)', () => {
  const lines = getProductLines();

  it('bevat alle 15 productlijnen uit docs/productdata.md', () => {
    expect(lines).toHaveLength(15);
    expect(seed.researched_at).toBe('2026-11-17');
  });

  it('heeft unieke ids', () => {
    expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
  });

  it.each(getProductLines().map((l) => [l.id, l] as const))('%s heeft geldige velden', (_id, line) => {
    expect(line.name).toBeTruthy();
    expect(CATEGORIES).toContain(line.category);
    expect(line.beginner_info.length).toBeGreaterThan(20);
    expect(line.short_bullets.length).toBeGreaterThan(0);
    expect(line.flavors.length).toBeGreaterThan(0);
    expect(line.sizes.length).toBeGreaterThan(0);
    expect(line.image_url).toBe(`/images/products/${line.id}.webp`);
    expect(line.xxl_url).toMatch(/^https:\/\/xxlnutrition\.com\//);
    for (const label of line.labels) expect(LABELS).toContain(label);
    for (const f of line.flavors) {
      expect(FLAVOR_FAMILIES).toContain(f.family);
      expect([1, 2, 3]).toContain(f.sweetness);
      expect(['romig', 'fris']).toContain(f.texture);
    }
    for (const s of line.sizes) {
      expect(s.price_eur).toBeGreaterThan(0);
      expect(['xxl', 'partner', 'calculated', 'brief']).toContain(s.source);
    }
    // needs_check op de productlijn hoort bij een uitleg
    expect(line.needs_check).toBe(line.check_notes.length > 0);
  });

  it('geen gezondheidsclaims in teksten (EU-claimsverordening)', () => {
    const forbidden = /spiergroei|spieren groeien|vetverbrand|afvallen gegarandeerd|geneest|voorkomt ziekte/i;
    for (const l of lines) {
      const text = [l.tagline, l.beginner_info, l.description, ...l.short_bullets].join(' ');
      expect(text, l.id).not.toMatch(forbidden);
    }
  });

  it('harde regels uit de brief zijn in de labels terug te vinden', () => {
    expect(getProductLine('blast-pre-workout')!.labels).toContain('bevat_cafeine');
    expect(getProductLine('blast-pre-workout-caffeine-free')!.labels).not.toContain('bevat_cafeine');
    expect(getProductLine('green-protein')!.labels).toContain('vegan');
    expect(getProductLine('creatine-monohydraat')!.labels).toContain('vegan');
    expect(getProductLine('whey-protein-zero')!.labels).toContain('lactosevrij');
    expect(getProductLine('whey-delicious')!.labels).not.toContain('lactosevrij');
  });
});
