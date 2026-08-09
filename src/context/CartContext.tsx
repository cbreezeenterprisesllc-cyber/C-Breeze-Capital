import { createContext, useContext, useReducer, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  thcContent: string;
  unit: string;
  tenantId: string;
  tenantName: string;
}

interface CartState {
  items: CartItem[];
  tenantId: string | null;
  tenantName: string;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" };

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tenantId: string | null;
  tenantName: string;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
          tenantId: action.payload.tenantId,
          tenantName: action.payload.tenantName,
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload],
        tenantId: action.payload.tenantId,
        tenantName: action.payload.tenantName,
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.payload),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: Math.max(0, action.payload.quantity) }
            : i
        ).filter((i) => i.quantity > 0),
      };
    case "CLEAR_CART":
      return { items: [], tenantId: null, tenantName: "" };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    tenantId: null,
    tenantName: "",
  });

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    itemCount,
    subtotal,
    tenantId: state.tenantId,
    tenantName: state.tenantName,
    addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    removeItem: (productId) => dispatch({ type: "REMOVE_ITEM", payload: productId }),
    updateQuantity: (productId, quantity) =>
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}