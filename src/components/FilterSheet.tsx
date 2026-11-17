import { useEffect } from 'react';
import { DIETS, PRICE_RANGES, type CatalogFilters } from '../data/filters';
import { CATEGORIES, FLAVOR_FAMILIES } from '../data/types';
import { FLAVOR_FAMILY_LABELS } from '../lib/format';
import { CheckIcon, CloseIcon } from './Icons';

interface Props {
  open: boolean;
  filters: CatalogFilters;
  resultCount: number;
  onChange: (f: CatalogFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold transition ${
        active ? 'border-xxl-black bg-xxl-black text-xxl-white' : 'border-xxl-black/15 bg-xxl-white text-xxl-black hover:border-xxl-black/40'
      }`}
    >
      {active && <CheckIcon size={16} />}
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-xxl-black/10 py-4">
      <legend className="sr-only">{title}</legend>
      <h3 className="mb-3 text-xs font-extrabold tracking-wider uppercase">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Filterscherm dat van onderen inschuift. */
export function FilterSheet({ open, filters, resultCount, onChange, onClear, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end" role="dialog" aria-modal="true" aria-label="Filters">
      <button type="button" className="absolute inset-0 bg-xxl-black/50" aria-label="Sluit filters" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] flex-col rounded-t-2xl bg-xxl-white">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-black uppercase">Filter</h2>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-xxl-grey" aria-label="Sluiten">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto px-4">
          <Group title="Categorie">
            {CATEGORIES.map((c) => (
              <Chip key={c} active={filters.categories.includes(c)} onClick={() => onChange({ ...filters, categories: toggle(filters.categories, c) })}>
                {c}
              </Chip>
            ))}
          </Group>
          <Group title="Prijs (vanaf-prijs)">
            {PRICE_RANGES.map((r) => (
              <Chip key={r.id} active={filters.priceRanges.includes(r.id)} onClick={() => onChange({ ...filters, priceRanges: toggle(filters.priceRanges, r.id) })}>
                {r.label}
              </Chip>
            ))}
          </Group>
          <Group title="Dieet">
            {DIETS.map((d) => (
              <Chip key={d.id} active={filters.diets.includes(d.id)} onClick={() => onChange({ ...filters, diets: toggle(filters.diets, d.id) })}>
                {d.label}
              </Chip>
            ))}
          </Group>
          <Group title="Smaak">
            {FLAVOR_FAMILIES.map((f) => (
              <Chip key={f} active={filters.flavorFamilies.includes(f)} onClick={() => onChange({ ...filters, flavorFamilies: toggle(filters.flavorFamilies, f) })}>
                {FLAVOR_FAMILY_LABELS[f]}
              </Chip>
            ))}
          </Group>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-xxl-black/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClear} className="min-h-12 rounded-md border-2 border-xxl-black text-sm font-extrabold uppercase">
            Wis filters
          </button>
          <button type="button" onClick={onClose} className="min-h-12 rounded-md bg-xxl-red text-sm font-extrabold text-xxl-white uppercase">
            Toon {resultCount} {resultCount === 1 ? 'product' : 'producten'}
          </button>
        </div>
      </div>
    </div>
  );
}
