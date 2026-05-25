import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Produit } from '@shared/types';

const CART_KEY = 'saint_cyp_portal_cart_v1';

export interface CartItem {
  produit: Produit;
  quantite: number;
}

interface CartState {
  commercantId: string | null;
  items: CartItem[];
}

interface CartContextValue {
  cart: CartState;
  itemCount: number;
  totalCents: number;
  addItem: (produit: Produit, quantite?: number) => { switched?: boolean };
  setQuantity: (produitId: string, quantite: number) => void;
  removeItem: (produitId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({ commercantId: null, items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        // ignore corrupt cart
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  const itemCount = cart.items.reduce((s, i) => s + i.quantite, 0);
  const totalCents = cart.items.reduce(
    (s, i) => s + i.produit.prix_cents * i.quantite,
    0
  );

  const addItem = (produit: Produit, quantite = 1) => {
    let switched = false;
    setCart((curr) => {
      if (curr.commercantId && curr.commercantId !== produit.commercant_id) {
        switched = true;
        return {
          commercantId: produit.commercant_id,
          items: [{ produit, quantite }],
        };
      }
      const idx = curr.items.findIndex((it) => it.produit.id === produit.id);
      if (idx >= 0) {
        const items = [...curr.items];
        items[idx] = { ...items[idx], quantite: items[idx].quantite + quantite };
        return { commercantId: produit.commercant_id, items };
      }
      return {
        commercantId: produit.commercant_id,
        items: [...curr.items, { produit, quantite }],
      };
    });
    return { switched };
  };

  const removeItem = (produitId: string) => {
    setCart((curr) => {
      const items = curr.items.filter((it) => it.produit.id !== produitId);
      return {
        commercantId: items.length === 0 ? null : curr.commercantId,
        items,
      };
    });
  };

  const setQuantity = (produitId: string, quantite: number) => {
    if (quantite <= 0) {
      removeItem(produitId);
      return;
    }
    setCart((curr) => ({
      ...curr,
      items: curr.items.map((it) =>
        it.produit.id === produitId ? { ...it, quantite } : it
      ),
    }));
  };

  const clear = () => {
    setCart({ commercantId: null, items: [] });
  };

  return (
    <CartContext.Provider
      value={{ cart, itemCount, totalCents, addItem, setQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
