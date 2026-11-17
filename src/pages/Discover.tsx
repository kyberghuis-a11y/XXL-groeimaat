import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterSheet } from '../components/FilterSheet';
import { CloseIcon, FilterIcon, SearchIcon } from '../components/Icons';
import { PageTitle } from '../components/Layout';
import { ProductCard } from '../components/ProductBits';
import { getProductLines } from '../data/catalog';
import { activeFilterCount, EMPTY_FILTERS, filterProducts, SORTS, sortProducts, type SortId } from '../data/filters';
import { useCatalogState } from '../lib/catalogState';

export function Discover() {
  const { filters, setFilters, sort, setSort } = useCatalogState();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  // Zoekknop in de header stuurt naar /ontdek?zoek=1: zet dan de focus op het zoekveld.
  useEffect(() => {
    if (params.get('zoek') === '1') {
      searchRef.current?.focus();
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const all = getProductLines();
  const results = useMemo(() => sortProducts(filterProducts(all, filters), sort), [all, filters, sort]);
  const count = activeFilterCount(filters);
  const clearAll = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="space-y-4 p-4">
      <PageTitle>Ontdek XXL</PageTitle>

      <label className="relative block">
        <span className="sr-only">Zoek op product of smaak</span>
        <SearchIcon size={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xxl-black/50" />
        <input
          ref={searchRef}
          type="search"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Zoek op product of smaak"
          className="min-h-12 w-full rounded-md border-2 border-xxl-black/10 bg-xxl-white pr-10 pl-10 text-base outline-none focus:border-xxl-black"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => setFilters({ ...filters, query: '' })}
            className="absolute top-1/2 right-1 grid h-10 w-10 -translate-y-1/2 place-items-center"
            aria-label="Zoekterm wissen"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-xxl-black px-4 text-sm font-extrabold text-xxl-white uppercase"
        >
          <FilterIcon size={18} />
          Filter
          {count > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-xxl-red px-1 text-[11px]">{count}</span>
          )}
        </button>
        <label className="ml-auto flex min-w-0 items-center gap-2 text-sm">
          <span className="sr-only font-semibold whitespace-nowrap min-[400px]:not-sr-only">Sorteer op</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="min-h-11 min-w-0 rounded-md border-2 border-xxl-black/10 bg-xxl-white px-2 font-semibold"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p aria-live="polite">
          <strong>{results.length}</strong> {results.length === 1 ? 'productlijn' : 'productlijnen'}
        </p>
        {(count > 0 || filters.query) && (
          <button type="button" onClick={clearAll} className="min-h-11 font-bold text-xxl-red underline underline-offset-4">
            Wis filters
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {results.map((p) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-xxl-white p-6 text-center">
          <p className="text-lg font-black uppercase">Geen producten gevonden</p>
          <p className="mt-2 text-sm text-xxl-black/70">Probeer minder filters of een andere zoekterm.</p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 min-h-12 rounded-md bg-xxl-red px-6 text-sm font-extrabold text-xxl-white uppercase"
          >
            Wis filters
          </button>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        resultCount={results.length}
        onChange={setFilters}
        onClear={() => setFilters({ ...EMPTY_FILTERS, query: filters.query })}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
