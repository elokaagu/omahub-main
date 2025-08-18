"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { toast } from "sonner";

// Types
export interface BasketItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  size?: string;
  colour?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Basket {
  id: string;
  userId: string;
  items: BasketItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface BasketState {
  baskets: Basket[];
  isLoading: boolean;
  error: string | null;
}

type BasketAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_BASKETS"; payload: Basket[] }
  | { type: "ADD_ITEM"; payload: { basketId: string; item: BasketItem } }
  | { type: "REMOVE_ITEM"; payload: { basketId: string; itemId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { basketId: string; itemId: string; quantity: number } }
  | { type: "CLEAR_BASKET"; payload: string };

// Initial state
const initialState: BasketState = {
  baskets: [],
  isLoading: false,
  error: null,
};

// Reducer function
function basketReducer(state: BasketState, action: BasketAction): BasketState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_BASKETS":
      return { ...state, baskets: action.payload, error: null };
    case "ADD_ITEM":
      return {
        ...state,
        baskets: state.baskets.map((basket) =>
          basket.id === action.payload.basketId
            ? {
                ...basket,
                items: [...basket.items, action.payload.item],
                totalItems: basket.totalItems + action.payload.item.quantity,
                totalPrice: basket.totalPrice + action.payload.item.price * action.payload.item.quantity,
              }
            : basket
        ),
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        baskets: state.baskets.map((basket) =>
          basket.id === action.payload.basketId
            ? {
                ...basket,
                items: basket.items.filter((item) => item.id !== action.payload.itemId),
                totalItems: basket.items
                  .filter((item) => item.id !== action.payload.itemId)
                  .reduce((sum, item) => sum + item.quantity, 0),
                totalPrice: basket.items
                  .filter((item) => item.id !== action.payload.itemId)
                  .reduce((sum, item) => sum + item.price * item.quantity, 0),
              }
            : basket
        ),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        baskets: state.baskets.map((basket) =>
          basket.id === action.payload.basketId
            ? {
                ...basket,
                items: basket.items.map((item) =>
                  item.id === action.payload.itemId
                    ? { ...item, quantity: action.payload.quantity }
                    : item
                ),
                totalItems: basket.items.reduce((sum, item) => sum + (item.id === action.payload.itemId ? action.payload.quantity : item.quantity), 0),
                totalPrice: basket.items.reduce((sum, item) => sum + item.price * (item.id === action.payload.itemId ? action.payload.quantity : item.quantity), 0),
              }
            : basket
        ),
      };
    case "CLEAR_BASKET":
      return {
        ...state,
        baskets: state.baskets.map((basket) =>
          basket.id === action.payload
            ? { ...basket, items: [], totalItems: 0, totalPrice: 0 }
            : basket
        ),
      };
    default:
      return state;
  }
}

// Context
const BasketContext = createContext<{
  state: BasketState;
  addToBasket: (productId: string, quantity: number, size?: string, colour?: string) => Promise<void>;
  removeFromBasket: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearBasket: (basketId: string) => Promise<void>;
  refreshBaskets: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
} | null>(null);

// Provider component
export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(basketReducer, initialState);

  // Fetch baskets from API
  const fetchBaskets = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await fetch("/api/basket");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch baskets");
      }

      dispatch({ type: "SET_BASKETS", payload: data.baskets || [] });
    } catch (error) {
      console.error("Error fetching baskets:", error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to fetch baskets" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Add item to basket
  const addToBasket = useCallback(async (productId: string, quantity: number, size?: string, colour?: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await fetch("/api/basket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
          size,
          colour,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add item to basket");
      }

      // Refresh baskets to get updated state
      await fetchBaskets();
      toast.success("Item added to basket");
    } catch (error) {
      console.error("Error adding to basket:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add item to basket";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [fetchBaskets]);

  // Remove item from basket
  const removeFromBasket = useCallback(async (itemId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await fetch(`/api/basket?itemId=${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove item from basket");
      }

      // Refresh baskets to get updated state
      await fetchBaskets();
      toast.success("Item removed from basket");
    } catch (error) {
      console.error("Error removing from basket:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to remove item from basket";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [fetchBaskets]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await fetch(`/api/basket?itemId=${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update quantity");
      }

      // Refresh baskets to get updated state
      await fetchBaskets();
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update quantity";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [fetchBaskets]);

  // Clear basket
  const clearBasket = useCallback(async (basketId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await fetch(`/api/basket/clear?basketId=${basketId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear basket");
      }

      // Refresh baskets to get updated state
      await fetchBaskets();
      toast.success("Basket cleared");
    } catch (error) {
      console.error("Error clearing basket:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to clear basket";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [fetchBaskets]);

  // Get total items across all baskets
  const getTotalItems = useCallback(() => {
    return state.baskets.reduce((total, basket) => total + basket.totalItems, 0);
  }, [state.baskets]);

  // Get total price across all baskets
  const getTotalPrice = useCallback(() => {
    return state.baskets.reduce((total, basket) => total + basket.totalPrice, 0);
  }, [state.baskets]);

  // Load baskets on mount
  useEffect(() => {
    fetchBaskets();
  }, [fetchBaskets]);

  const value = {
    state,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    refreshBaskets: fetchBaskets,
    getTotalItems,
    getTotalPrice,
  };

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

// Hook to use basket context
export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return context;
}
