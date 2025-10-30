import { create } from 'zustand';
import { Product } from '../utils/products';

type CartEntry = {
  product: Product;
  quantity: number;
};

type CartItemsMap = Record<string, CartEntry>;

type CartState = {
  items: CartItemsMap;
  incrementItem: (key: string, product: Product) => void;
  decrementItem: (key: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: {},
  incrementItem: (key, product) =>
    set((state) => {
      return {
        items: {
          ...state.items,
          [key]: {
            product,
            quantity: (state.items[key]?.quantity ?? 0) + 1,
          },
        },
      };
    }),
  decrementItem: (key) =>
    set((state) => {
      const entry = state.items[key];
      if (!entry) {
        return state;
      }

      const nextQuantity = entry.quantity - 1;

      if (nextQuantity <= 0) {
        const { [key]: _removed, ...rest } = state.items;
        return { items: rest };
      }

      return {
        items: {
          ...state.items,
          [key]: {
            ...entry,
            quantity: nextQuantity,
          },
        },
      };
    }),
  removeItem: (key) =>
    set((state) => {
      if (!state.items[key]) {
        return state;
      }
      const { [key]: _removed, ...rest } = state.items;
      return { items: rest };
    }),
  clear: () => set({ items: {} }),
}));

export const selectCartCount = (state: CartState) =>
  Object.values(state.items).reduce((sum, entry) => sum + entry.quantity, 0);

export const selectCartItems = (state: CartState) =>
  Object.entries(state.items).map(([key, entry]) => ({
    key,
    product: entry.product,
    quantity: entry.quantity,
  }));

export const makeSelectIsInCart =
  (key: string) =>
  (state: CartState): boolean =>
    Boolean(state.items[key]);

export const makeSelectQuantity =
  (key: string) =>
  (state: CartState): number =>
    state.items[key]?.quantity ?? 0;
