import { create } from 'zustand';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  img: string;
  active?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  addToCart: (item) => {
    set((state) => {
      const exists = state.cart.find((i) => i.item.id === item.id);
      if (exists) {
        return {
          cart: state.cart.map((i) =>
            i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { cart: [...state.cart, { item, quantity: 1 }] };
    });
  },
  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.item.id !== id),
    }));
  },
  updateQuantity: (id, delta) => {
    set((state) => ({
      cart: state.cart.map((i) => {
        if (i.item.id === id) {
          const newQ = i.quantity + delta;
          return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
      }),
    }));
  },
  clearCart: () => set({ cart: [] }),
  getCartTotal: () => {
    return get().cart.reduce((total, { item, quantity }) => total + item.price * quantity, 0);
  },
}));
