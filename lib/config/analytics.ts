// Google Tag Manager Configuration for OmaHub
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-55JQB28Z";

// Google Analytics 4 Measurement ID (as fallback)
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-94EE1362LB";

// Check if GTM is enabled
export const GTM_ENABLED = !!GTM_ID;

// Page view tracking via GTM
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "page_view",
      page_location: url,
      page_title: document.title,
    });
  }
};

// Custom event tracking via GTM
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "custom_event",
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value,
    });
  }
};

// E-commerce tracking via GTM
export const ecommerce = {
  // Add to cart
  addToCart: (item: {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    currency: string;
    brand?: string;
    category?: string;
  }) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "add_to_cart",
        ecommerce: {
          currency: item.currency,
          value: item.price * item.quantity,
          items: [
            {
              item_id: item.item_id,
              item_name: item.item_name,
              price: item.price,
              quantity: item.quantity,
              currency: item.currency,
              brand: item.brand,
              category: item.category,
            },
          ],
        },
      });
    }
  },

  // Begin checkout
  beginCheckout: (
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
      currency: string;
      brand?: string;
      category?: string;
    }>
  ) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      const totalValue = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      window.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: items[0]?.currency || "USD",
          value: totalValue,
          items: items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity,
            currency: item.currency,
            brand: item.brand,
            category: item.category,
          })),
        },
      });
    }
  },

  // Purchase
  purchase: (transaction: {
    transaction_id: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
      brand?: string;
      category?: string;
    }>;
  }) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: transaction.transaction_id,
          value: transaction.value,
          currency: transaction.currency,
          tax: transaction.tax,
          shipping: transaction.shipping,
          items: transaction.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity,
            brand: item.brand,
            category: item.category,
          })),
        },
      });
    }
  },

  // View item
  viewItem: (item: {
    item_id: string;
    item_name: string;
    price: number;
    currency: string;
    brand?: string;
    category?: string;
  }) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: item.currency,
          value: item.price,
          items: [
            {
              item_id: item.item_id,
              item_name: item.item_name,
              price: item.price,
              currency: item.currency,
              brand: item.brand,
              category: item.category,
            },
          ],
        },
      });
    }
  },

  // View item list
  viewItemList: (
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      currency: string;
      brand?: string;
      category?: string;
    }>,
    list_name?: string
  ) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "view_item_list",
        ecommerce: {
          item_list_name: list_name || "Product List",
          items: items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            currency: item.currency,
            brand: item.brand,
            category: item.category,
          })),
        },
      });
    }
  },
};

// User engagement tracking via GTM
export const engagement = {
  // User login
  login: (method: string) => {
    event({
      action: "login",
      category: "engagement",
      label: method,
    });
  },

  // User signup
  signup: (method: string) => {
    event({
      action: "sign_up",
      category: "engagement",
      label: method,
    });
  },

  // Brand creation
  createBrand: (brandName: string) => {
    event({
      action: "create_brand",
      category: "engagement",
      label: brandName,
    });
  },

  // Product creation
  createProduct: (productName: string, brandName: string) => {
    event({
      action: "create_product",
      category: "engagement",
      label: `${brandName} - ${productName}`,
    });
  },

  // Custom order submission
  submitCustomOrder: (brandName: string, orderValue: number) => {
    event({
      action: "submit_custom_order",
      category: "engagement",
      label: brandName,
      value: orderValue,
    });
  },

  // Studio access
  studioAccess: (userRole: string) => {
    event({
      action: "studio_access",
      category: "engagement",
      label: userRole,
    });
  },
};

// Search tracking via GTM
export const search = {
  // Search query
  searchQuery: (query: string, resultsCount: number) => {
    event({
      action: "search",
      category: "engagement",
      label: query,
      value: resultsCount,
    });
  },

  // Filter usage
  useFilter: (filterType: string, filterValue: string) => {
    event({
      action: "use_filter",
      category: "engagement",
      label: `${filterType}: ${filterValue}`,
    });
  },
};

// Error tracking via GTM
export const error = {
  // Track errors
  trackError: (errorType: string, errorMessage: string, pageUrl?: string) => {
    event({
      action: "error",
      category: "error",
      label: `${errorType}: ${errorMessage}`,
    });
  },
};
