import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  dropId: string;
  name: string;
  size: string;
  price: number;
  image?: string;
  qty: number;
  /** For configurator items: storage paths + config payload submitted at deploy time */
  config?: {
    artwork_path?: string | null;
    mockup_path?: string | null;
    config_json?: Record<string, unknown>;
  };
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: Omit<CartItem, "id" | "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (item) => {
        const id = `${item.dropId}-${item.size}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...get().items, { ...item, id, qty: item.qty ?? 1 }],
            isOpen: true,
          });
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setQty: (id, qty) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, qty) } : i,
          ),
        }),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "ghost-protocol-cart" },
  ),
);

export const formatINR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
