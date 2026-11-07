"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartStoredItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  brand: string;
  price: number;
  discountPercent: number;
  size: string;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartStoredItem[];
  addItem: (item: Omit<CartStoredItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const index = state.items.findIndex(
            (line) => line.productId === item.productId && line.size === item.size,
          );
          if (index >= 0) {
            const next = [...state.items];
            const existing = next[index];
            next[index] = {
              ...existing,
              ...item,
              quantity: Math.min(
                Math.max(1, existing.quantity + quantity),
                Math.max(1, item.stock),
              ),
            };
            return { items: next };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(Math.max(1, quantity), Math.max(1, item.stock)),
              },
            ],
          };
        }),
      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (line) => !(line.productId === productId && line.size === size),
          ),
        })),
      setQuantity: (productId, size, quantity) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.productId === productId && line.size === size
              ? {
                  ...line,
                  quantity: Math.min(Math.max(1, quantity), Math.max(1, line.stock)),
                }
              : line,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "sporsify-cart",
      version: 1,
    },
  ),
);

export function cartCount(items: CartStoredItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartStoredItem[]) {
  return items.reduce((sum, item) => {
    const sale = Math.round(item.price - (item.price * item.discountPercent) / 100);
    return sum + sale * item.quantity;
  }, 0);
}
