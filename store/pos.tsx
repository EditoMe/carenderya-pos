import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MENU, type Category, type MenuItem } from '@/data/menu';
import type { OrderStatus, OrderType, PaymentMethod } from '@/constants/theme';

export interface CartLine {
  id: string;
  qty: number;
}

/** Snapshot taken at order time so past orders survive menu edits. */
export interface OrderLine {
  id: string;
  qty: number;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  type: OrderType;
  status: OrderStatus;
  payment?: PaymentMethod;
  createdAt: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface NewProduct {
  name: string;
  price: number;
  category: Category;
  emoji: string;
}

interface MenuOverrides {
  prices: Record<string, number>;
  availability: Record<string, boolean>;
  removed: string[];
  added: (NewProduct & { id: string; tint: string })[];
}

const MENU_KEY = 'pos-menu-v1';
const EMPTY_OVERRIDES: MenuOverrides = { prices: {}, availability: {}, removed: [], added: [] };

interface PosState {
  menu: MenuItem[];
  toggleAvailable: (id: string) => void;
  updatePrice: (id: string, price: number) => void;
  addItem: (p: NewProduct) => void;
  removeItem: (id: string) => void;
  cart: CartLine[];
  add: (id: string) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  promo: boolean;
  setPromo: (v: boolean) => void;
  orders: Order[];
  placeOrder: (payment: PaymentMethod) => Order;
  updateStatus: (id: string, status: OrderStatus) => void;
  totals: { subtotal: number; discount: number; tax: number; total: number; count: number };
  priceOf: (id: string) => number;
  nameOf: (id: string) => string;
}

const PosContext = createContext<PosState | null>(null);

let orderSeq = 1025;

const seed = (): Order[] => [
  {
    id: 'DY1022',
    lines: [
      { id: 'adobo', qty: 1, name: 'Chicken Adobo', price: 65 },
      { id: 'plain-rice', qty: 2, name: 'Plain Rice', price: 15 },
    ],
    type: 'Dine In',
    status: 'Ready to Serve',
    payment: 'Cash',
    createdAt: Date.now() - 1000 * 60 * 14,
    subtotal: 95, discount: 0, tax: 11.4, total: 106.4,
  },
  {
    id: 'DY1023',
    lines: [
      { id: 'sinigang', qty: 1, name: 'Pork Sinigang', price: 80 },
      { id: 'sago', qty: 1, name: "Sago't Gulaman", price: 25 },
    ],
    type: 'Take Away',
    status: 'In Progress',
    createdAt: Date.now() - 1000 * 60 * 9,
    subtotal: 105, discount: 0, tax: 12.6, total: 117.6,
  },
  {
    id: 'DY1024',
    lines: [
      { id: 'sisig', qty: 2, name: 'Sisig', price: 85 },
      { id: 'plain-rice', qty: 2, name: 'Plain Rice', price: 15 },
    ],
    type: 'Deliver',
    status: 'In Progress',
    createdAt: Date.now() - 1000 * 60 * 4,
    subtotal: 200, discount: 20, tax: 21.6, total: 201.6,
  },
];

const TINT_BY_CATEGORY: Record<Category, string> = {
  Ulam: '#F7E3C8',
  Kanin: '#F1EAD9',
  Sabaw: '#FFE0D6',
  Inumin: '#DDEEDC',
  Merienda: '#FDEBC0',
  Extras: '#F9E3B8',
};

export function PosProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<MenuOverrides>(EMPTY_OVERRIDES);
  const [cart, setCart] = useState<CartLine[]>([
    { id: 'adobo', qty: 2 },
    { id: 'sinigang', qty: 1 },
    { id: 'sisig', qty: 1 },
  ]);
  const [orderType, setOrderType] = useState<OrderType>('Dine In');
  const [promo, setPromo] = useState(false);
  const [orders, setOrders] = useState<Order[]>(seed);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MENU_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<MenuOverrides>;
        setOverrides({
          prices: parsed.prices ?? {},
          availability: parsed.availability ?? {},
          removed: Array.isArray(parsed.removed) ? parsed.removed : [],
          added: Array.isArray(parsed.added) ? parsed.added : [],
        });
      } catch {
        // corrupted storage — start fresh from the prototype menu
      }
    })();
  }, []);

  const persist = useCallback(async (next: MenuOverrides) => {
    setOverrides(next);
    try {
      await AsyncStorage.setItem(MENU_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const menu = useMemo<MenuItem[]>(() => {
    const base = MENU.filter((m) => !overrides.removed.includes(m.id)).map((m) => ({
      ...m,
      price: overrides.prices[m.id] ?? m.price,
      available: overrides.availability[m.id] ?? m.available,
    }));
    const added: MenuItem[] = overrides.added
      .filter((a) => !overrides.removed.includes(a.id))
      .map((a) => ({ ...a, available: overrides.availability[a.id] ?? true }));
    return [...base, ...added];
  }, [overrides]);

  const priceMap = useMemo(() => new Map(menu.map((m) => [m.id, m.price])), [menu]);
  const nameMap = useMemo(() => new Map(menu.map((m) => [m.id, m.name])), [menu]);
  const priceOf = useCallback((id: string) => priceMap.get(id) ?? 0, [priceMap]);
  const nameOf = useCallback((id: string) => nameMap.get(id) ?? id, [nameMap]);

  const toggleAvailable = useCallback(
    (id: string) => {
      const current = menu.find((m) => m.id === id)?.available ?? true;
      persist({ ...overrides, availability: { ...overrides.availability, [id]: !current } });
    },
    [menu, overrides, persist],
  );

  const updatePrice = useCallback(
    (id: string, price: number) => {
      if (!Number.isFinite(price) || price <= 0) return;
      persist({ ...overrides, prices: { ...overrides.prices, [id]: Math.round(price * 100) / 100 } });
    },
    [overrides, persist],
  );

  const addItem = useCallback(
    (p: NewProduct) => {
      const id = `custom-${Date.now()}`;
      const item = { ...p, id, tint: TINT_BY_CATEGORY[p.category] };
      persist({ ...overrides, added: [...overrides.added, item] });
    },
    [overrides, persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      const isAdded = overrides.added.some((a) => a.id === id);
      const next: MenuOverrides = {
        ...overrides,
        added: isAdded ? overrides.added.filter((a) => a.id !== id) : overrides.added,
        removed: isAdded ? overrides.removed : [...overrides.removed, id],
      };
      delete next.prices[id];
      delete next.availability[id];
      persist(next);
      // Purge it from the active cart; past orders keep their snapshots.
      setCart((c) => c.filter((l) => l.id !== id));
    },
    [overrides, persist],
  );

  const add = useCallback((id: string) => {
    setCart((c) => {
      const f = c.find((l) => l.id === id);
      if (f) return c.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { id, qty: 1 }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCart((c) => {
      const f = c.find((l) => l.id === id);
      if (!f) return c;
      if (f.qty <= 1) return c.filter((l) => l.id !== id);
      return c.map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l));
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setCart((c) =>
      qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + (priceMap.get(l.id) ?? 0) * l.qty, 0);
    const discount = promo ? subtotal * 0.1 : 0;
    const tax = (subtotal - discount) * 0.12;
    const total = subtotal - discount + tax;
    const count = cart.reduce((s, l) => s + l.qty, 0);
    return { subtotal, discount, tax, total, count };
  }, [cart, priceMap, promo]);

  const placeOrder = useCallback(
    (payment: PaymentMethod) => {
      const lines: OrderLine[] = cart.map((l) => ({
        ...l,
        name: nameMap.get(l.id) ?? l.id,
        price: priceMap.get(l.id) ?? 0,
      }));
      const order: Order = {
        id: `DY${orderSeq++}`,
        lines,
        type: orderType,
        status: 'In Progress',
        payment,
        createdAt: Date.now(),
        ...totals,
      };
      setOrders((o) => [order, ...o]);
      setCart([]);
      setPromo(false);
      return order;
    },
    [cart, orderType, totals, nameMap, priceMap],
  );

  const updateStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((o) => o.map((ord) => (ord.id === id ? { ...ord, status } : ord)));
  }, []);

  const value: PosState = {
    menu, toggleAvailable, updatePrice, addItem, removeItem,
    cart, add, remove, setQty, clearCart,
    orderType, setOrderType, promo, setPromo,
    orders, placeOrder, updateStatus, totals, priceOf, nameOf,
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used inside PosProvider');
  return ctx;
}
