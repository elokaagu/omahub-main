"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ecommerce } from "@/lib/config/analytics";

// Types - Updated to match actual API response structure
export interface BasketItem {
  id: string;
  basket_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  colour?: string;
  price: number;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    title: string;
    price: number;
    sale_price?: number;
    images: string[];
    brand: {
      name: string;
    };
  };
}

export interface Basket {
  id: string;
  user_id: string;
  total_items: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  basket_items: BasketItem[];
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
  | {
      type: "UPDATE_QUANTITY";
      payload: { basketId: string; itemId: string; quantity: number };
    }
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
                basket_items: [...basket.basket_items, action.payload.item],
                total_items: basket.total_items + action.payload.item.quantity,
                total_price:
                  basket.total_price +
                  action.payload.item.price * action.payload.item.quantity,
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
                basket_items: basket.basket_items.filter(
                  (item) => item.id !== action.payload.itemId
                ),
                total_items: basket.basket_items
                  .filter((item) => item.id !== action.payload.itemId)
                  .reduce(
                    (sum: number, item: BasketItem) => sum + item.quantity,
                    0
                  ),
                total_price: basket.basket_items
                  .filter((item) => item.id !== action.payload.itemId)
                  .reduce(
                    (sum: number, item: BasketItem) =>
                      sum + item.price * item.quantity,
                    0
                  ),
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
                basket_items: basket.basket_items.map((item) =>
                  item.id === action.payload.itemId
                    ? { ...item, quantity: action.payload.quantity }
                    : item
                ),
                total_items: basket.basket_items.reduce(
                  (sum: number, item: BasketItem) =>
                    sum +
                    (item.id === action.payload.itemId
                      ? action.payload.quantity
                      : item.quantity),
                  0
                ),
                total_price: basket.basket_items.reduce(
                  (sum: number, item: BasketItem) =>
                    sum +
                    item.price *
                      (item.id === action.payload.itemId
                        ? action.payload.quantity
                        : item.quantity),
                  0
                ),
              }
            : basket
        ),
      };
    case "CLEAR_BASKET":
      return {
        ...state,
        baskets: state.baskets.map((basket) =>
          basket.id === action.payload
            ? { ...basket, basket_items: [], total_items: 0, total_price: 0 }
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
  addToBasket: (
    productId: string,
    quantity: number,
    size?: string,
    colour?: string
  ) => Promise<void>;
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
  const { user } = useAuth();

  // Fetch baskets from API
  const fetchBaskets = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user) {
      dispatch({ type: "SET_BASKETS", payload: [] });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await fetch("/api/basket", {
        method: "GET",
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch baskets");
      }

      dispatch({ type: "SET_BASKETS", payload: data.baskets || [] });
    } catch (error) {
      console.error("Error fetching baskets:", error);
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to fetch baskets",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [user]);

  // Add item to basket
  const addToBasket = useCallback(
    async (
      productId: string,
      quantity: number,
      size?: string,
      colour?: string
    ) => {
      if (!user) {
        toast.error("Please sign in to add items to your basket");
        return;
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const response = await fetch("/api/basket", {
          method: "POST",
          credentials: "include", // Include cookies for authentication
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

        // Track add to cart in Google Analytics
        ecommerce.addToCart({
          item_id: productId,
          item_name: data.product?.title || "Product",
          price: data.product?.price || 0,
          quantity: quantity,
          currency: "GBP", // Default to GBP for OmaHub
          brand: data.product?.brand?.name,
          category: data.product?.category,
        });

        // Refresh baskets to get updated state
        await fetchBaskets();
        toast.success("Item added to basket");
      } catch (error) {
        console.error("Error adding to basket:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to add item to basket";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [fetchBaskets, user]
  );

  // Remove item from basket
  const removeFromBasket = useCallback(
    async (itemId: string) => {
      if (!user) {
        toast.error("Please sign in to manage your basket");
        return;
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const response = await fetch(`/api/basket?itemId=${itemId}`, {
          method: "DELETE",
          credentials: "include", // Include cookies for authentication
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
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to remove item from basket";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [fetchBaskets, user]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user) {
        toast.error("Please sign in to manage your basket");
        return;
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const response = await fetch(`/api/basket?itemId=${itemId}`, {
          method: "PATCH",
          credentials: "include", // Include cookies for authentication
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
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update quantity";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [fetchBaskets, user]
  );

  // Clear basket
  const clearBasket = useCallback(
    async (basketId: string) => {
      if (!user) {
        toast.error("Please sign in to manage your basket");
        return;
      }

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
        const errorMessage =
          error instanceof Error ? error.message : "Failed to clear basket";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [fetchBaskets, user]
  );

  // Get total items across all baskets
  const getTotalItems = useCallback(() => {
    if (!state.baskets || !Array.isArray(state.baskets)) {
      return 0;
    }
    return state.baskets.reduce((total, basket) => {
      const basketTotal = basket?.total_items;
      return (
        total +
        (typeof basketTotal === "number" && !isNaN(basketTotal)
          ? basketTotal
          : 0)
      );
    }, 0);
  }, [state.baskets]);

  // Get total price across all baskets
  const getTotalPrice = useCallback(() => {
    if (!state.baskets || !Array.isArray(state.baskets)) {
      return 0;
    }
    return state.baskets.reduce((total, basket) => {
      const basketPrice = basket?.total_price;
      return (
        total +
        (typeof basketPrice === "number" && !isNaN(basketPrice)
          ? basketPrice
          : 0)
      );
    }, 0);
  }, [state.baskets]);

  // Load baskets when user changes
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

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

// Hook to use basket context
export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return context;
}
