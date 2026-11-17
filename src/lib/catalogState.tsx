import { createContext, useContext, useState } from 'react';
import { EMPTY_FILTERS, type CatalogFilters, type SortId } from '../data/filters';

// Bewaart filters en sortering terwijl je naar een product en weer terug navigeert.
interface CatalogState {
  filters: CatalogFilters;
  setFilters: (f: CatalogFilters) => void;
  sort: SortId;
  setSort: (s: SortId) => void;
}

const Ctx = createContext<CatalogState | null>(null);

export function CatalogStateProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortId>('popular');
  return <Ctx.Provider value={{ filters, setFilters, sort, setSort }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogState(): CatalogState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useCatalogState moet binnen CatalogStateProvider gebruikt worden');
  return value;
}
