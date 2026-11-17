import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addToCart, cartRows, parseCart, setQuantity, summarize, type CartLine, type CartRow, type CartSummary } from './cart';

const STORAGE_KEY = 'groeimaat.cart';

interface CartState {
  rows: CartRow[];
  summary: CartSummary;
  add: (variantId: string, quantity?: number) => void;
  setQty: (variantId: string, quantity: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartState | null>(null);

function load(): CartLine[] {
  try {
    return parseCart(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Winkelwagen in deze browser (ook zonder account). Afrekenen vraagt wel om in te loggen. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Opslag niet beschikbaar (bijv. privévenster): de winkelwagen werkt dan alleen tot je de pagina sluit.
    }
  }, [cart]);

  const add = useCallback((variantId: string, quantity = 1) => setCart((c) => addToCart(c, variantId, quantity)), []);
  const setQty = useCallback((variantId: string, quantity: number) => setCart((c) => setQuantity(c, variantId, quantity)), []);
  const clear = useCallback(() => setCart([]), []);

  const value = useMemo(() => {
    const rows = cartRows(cart);
    return { rows, summary: summarize(rows), add, setQty, clear };
  }, [cart, add, setQty, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useCart moet binnen CartProvider gebruikt worden');
  return value;
}
