import {
  supabase,
  TailoredOrder,
  CustomerMeasurements,
  DeliveryAddress,
} from "../supabase";

/**
 * Create a new tailored order
 */
export async function createTailoredOrder(
  orderData: Omit<TailoredOrder, "id" | "created_at" | "updated_at">
): Promise<TailoredOrder | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailored_orders")
    .insert({
      ...orderData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tailored order:", error);
    throw error;
  }

  return data;
}

/**
 * Get tailored orders for a user
 */
export async function getUserTailoredOrders(
  userId: string
): Promise<TailoredOrder[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailored_orders")
    .select(
      `
      *,
      product:products(id, title, image, price),
      brand:brands(id, name, location)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user tailored orders:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get tailored orders for a brand
 */
export async function getBrandTailoredOrders(
  brandId: string
): Promise<TailoredOrder[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailored_orders")
    .select(
      `
      *,
      product:products(id, title, image, price),
      user:profiles(id, first_name, last_name, email)
    `
    )
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching brand tailored orders:", error);
    throw error;
  }

  return data || [];
}

/**
 * Update tailored order status
 */
export async function updateTailoredOrderStatus(
  orderId: string,
  status: TailoredOrder["status"],
  brandNotes?: string,
  estimatedCompletion?: string
): Promise<TailoredOrder | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (brandNotes) updateData.brand_notes = brandNotes;
  if (estimatedCompletion)
    updateData.estimated_completion = estimatedCompletion;

  const { data, error } = await supabase
    .from("tailored_orders")
    .update(updateData)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error updating tailored order status:", error);
    throw error;
  }

  return data;
}

/**
 * Get a single tailored order by ID
 */
export async function getTailoredOrderById(
  orderId: string
): Promise<TailoredOrder | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailored_orders")
    .select(
      `
      *,
      product:products(id, title, image, price, description),
      brand:brands(id, name, location, image),
      user:profiles(id, first_name, last_name, email)
    `
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching tailored order:", error);
    return null;
  }

  return data;
}

/**
 * Calculate estimated price for custom tailored work
 * This is a basic implementation - you can make it more sophisticated
 */
export function calculateTailoredPrice(
  basePrice: number,
  isCustom: boolean = false,
  measurements?: CustomerMeasurements
): number {
  let finalPrice = basePrice;

  // No additional markup for custom work - price is the same as base product
  // Add complexity fee based on special requirements if needed
  if (measurements?.special_requirements) {
    finalPrice += basePrice * 0.1; // 10% for special requirements
  }

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate order invoice data
 */
export function generateOrderInvoice(
  order: TailoredOrder,
  product: any,
  brand: any
) {
  return {
    orderNumber: `OMH-${order.id.slice(-8).toUpperCase()}`,
    orderDate: new Date(order.created_at).toLocaleDateString(),
    customerInfo: {
      name: order.delivery_address.full_name,
      email: order.delivery_address.email,
      phone: order.delivery_address.phone,
      address: {
        line1: order.delivery_address.address_line_1,
        city: order.delivery_address.city,
        state: order.delivery_address.state,
        postalCode: order.delivery_address.postal_code,
        country: order.delivery_address.country,
      },
    },
    brandInfo: {
      name: brand.name,
      location: brand.location,
    },
    productInfo: {
      title: product.title,
      basePrice: product.price,
      customizations: order.customer_notes || "None specified",
    },
    orderDetails: {
      status: order.status,
      totalAmount: order.total_amount,
      specialRequests: order.customer_notes,
      estimatedCompletion: order.estimated_completion,
    },
  };
}

/**
 * Format order data for email notifications
 */
export function formatOrderDataForEmail(
  order: TailoredOrder,
  product: any,
  brand: any
) {
  return {
    orderNumber: `OMH-${order.id.slice(-8).toUpperCase()}`,
    customerName: order.delivery_address.full_name,
    customerEmail: order.delivery_address.email,
    productTitle: product.title,
    brandName: brand.name,
    totalAmount: order.total_amount,
    orderDate: new Date(order.created_at).toLocaleDateString(),
    specialRequests: order.customer_notes || "None",
    deliveryAddress: {
      line1: order.delivery_address.address_line_1,
      city: order.delivery_address.city,
      state: order.delivery_address.state,
      postalCode: order.delivery_address.postal_code,
      country: order.delivery_address.country,
    },
  };
}
