import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { config } from "@/lib/config";

export interface CartItem {
  tierId: string;
  eventId: string;
  tierName: string;
  eventTitle: string;
  eventSlug: string;
  price: number;
  quantity: number;
  coverImageUrl?: string;
  platformFeePercent?: number;
  maxPerOrder?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (tierId: string) => void;
  updateQuantity: (tierId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  platformFee: number;
  total: number;
  itemCount: number;
  expiresAt: Date | null;
  startCheckout: () => void;
}

const CART_KEY = "tickethall_cart";
const CART_EXPIRY_KEY = "tickethall_cart_expiry";
const CART_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  subtotal: 0,
  platformFee: 0,
  total: 0,
  itemCount: 0,
  expiresAt: null,
  startCheckout: () => {},
});

export const useCart = () => useContext(CartContext);

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadExpiry(): Date | null {
  try {
    const stored = localStorage.getItem(CART_EXPIRY_KEY);
    if (!stored) return null;
    const date = new Date(stored);
    return date.getTime() > Date.now() ? date : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [expiresAt, setExpiresAt] = useState<Date | null>(loadExpiry);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (items.length === 0) {
      localStorage.removeItem(CART_EXPIRY_KEY);
      setExpiresAt(null);
    }
  }, [items]);

  // Check expiry
  useEffect(() => {
    if (!expiresAt) return;
    const timeout = setTimeout(() => {
      if (Date.now() >= expiresAt.getTime()) {
        setItems([]);
        setExpiresAt(null);
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(CART_EXPIRY_KEY);
      }
    }, Math.max(0, expiresAt.getTime() - Date.now()));
    return () => clearTimeout(timeout);
  }, [expiresAt]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Block adding items from a different event
      if (prev.length > 0 && prev[0].eventId !== item.eventId) {
        // Clear cart and start fresh with new event
        localStorage.removeItem(CART_KEY);
        return [item];
      }
      const existing = prev.find((i) => i.tierId === item.tierId);
      if (existing) {
        return prev.map((i) =>
          i.tierId === item.tierId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    if (!expiresAt) {
      const expiry = new Date(Date.now() + CART_DURATION_MS);
      setExpiresAt(expiry);
      localStorage.setItem(CART_EXPIRY_KEY, expiry.toISOString());
    }
  }, [expiresAt]);

  const removeItem = useCallback((tierId: string) => {
    setItems((prev) => prev.filter((i) => i.tierId !== tierId));
  }, []);

  const updateQuantity = useCallback((tierId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(tierId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.tierId === tierId ? { ...i, quantity } : i)));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setExpiresAt(null);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_EXPIRY_KEY);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const platformFee = subtotal === 0 ? 0 : items.reduce((sum, i) => {
    const feePercent = i.platformFeePercent ?? config.platformFeePercent;
    return sum + (i.price * i.quantity * feePercent / 100);
  }, 0);
  const total = subtotal + platformFee;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const startCheckout = useCallback(() => {
    if (!expiresAt) {
      const expiry = new Date(Date.now() + CART_DURATION_MS);
      setExpiresAt(expiry);
      localStorage.setItem(CART_EXPIRY_KEY, expiry.toISOString());
    }
  }, [expiresAt]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, platformFee, total, itemCount, expiresAt, startCheckout }}
    >
      {children}
    </CartContext.Provider>
  );
}
