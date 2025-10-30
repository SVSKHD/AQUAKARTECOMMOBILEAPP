import { create } from 'zustand';
import { Product } from '../utils/products';

type FavoriteItemsMap = Record<string, Product>;

type FavoritesState = {
  items: FavoriteItemsMap;
  toggleItem: (key: string, product: Product) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesState>((set) => ({
  items: {},
  toggleItem: (key, product) =>
    set((state) => {
      if (state.items[key]) {
        const { [key]: _removed, ...rest } = state.items;
        return { items: rest };
      }

      return {
        items: {
          ...state.items,
          [key]: product,
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

export const selectFavoriteCount = (state: FavoritesState) =>
  Object.keys(state.items).length;

export const selectFavoriteItems = (state: FavoritesState) =>
  Object.entries(state.items).map(([key, product]) => ({ key, product }));

export const makeSelectIsFavorite =
  (key: string) =>
  (state: FavoritesState): boolean =>
    Boolean(state.items[key]);
