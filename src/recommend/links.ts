import type { Recommendation } from './engine';

/** Link naar de productpagina met smaak en formaat al gekozen. */
export function productLink(r: Pick<Recommendation, 'line' | 'flavor' | 'size'>): string {
  const params = new URLSearchParams();
  if (r.flavor.name) params.set('smaak', r.flavor.name);
  params.set('formaat', r.size.label);
  return `/product/${r.line.id}?${params.toString()}`;
}

