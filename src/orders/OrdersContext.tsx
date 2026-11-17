import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { CartRow } from '../cart/cart';
import { supabase } from '../lib/supabase';
import { buildOrder, createDemoOrderService, createSupabaseOrderService, OrderError, type OrderService } from './orderService';
import type { Order, PaymentMethod } from './types';

interface OrdersState {
  orders: Order[]; // nieuwste eerst
  loading: boolean;
  error: string | null;
  place: (rows: CartRow[], payment: PaymentMethod) => Promise<Order>;
}

const Ctx = createContext<OrdersState | null>(null);

function createOrderService(): OrderService {
  return supabase ? createSupabaseOrderService(supabase) : createDemoOrderService(window.localStorage);
}

export function OrdersProvider({ children, service: injected }: { children: React.ReactNode; service?: OrderService }) {
  const service = useMemo(() => injected ?? createOrderService(), [injected]);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    service
      .list(userId)
      .then((list) => active && (setOrders(list), setError(null)))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : 'Laden mislukt.'))
      .finally(() => active && setLoadedFor(userId));
    return () => {
      active = false;
    };
  }, [service, userId]);

  const place = useCallback(
    async (rows: CartRow[], payment: PaymentMethod) => {
      if (!userId) throw new OrderError('Log in om te bestellen.');
      const saved = await service.create(userId, buildOrder(rows, payment, new Date()));
      setOrders((list) => [saved, ...list]);
      return saved;
    },
    [service, userId],
  );

  const value: OrdersState = {
    orders: userId && loadedFor === userId ? orders : [],
    loading: Boolean(userId) && loadedFor !== userId,
    error,
    place,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrders(): OrdersState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useOrders moet binnen OrdersProvider gebruikt worden');
  return value;
}
