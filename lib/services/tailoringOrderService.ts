import {
  supabase,
  TailoringOrder,
  CustomerMeasurements,
  DeliveryAddress,
} from "../supabase";

/**
 * Create a new tailoring order
 */
export async function createTailoringOrder(
  orderData: Omit<TailoringOrder, "id" | "created_at" | "updated_at">
): Promise<TailoringOrder | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailoring_orders")
    .insert({
      ...orderData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tailoring order:", error);
    throw error;
  }

  return data;
}

/**
 * Get tailoring orders for a user
 */
export async function getUserTailoringOrders(
  userId: string
): Promise<TailoringOrder[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailoring_orders")
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
    console.error("Error fetching user tailoring orders:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get tailoring orders for a brand
 */
export async function getBrandTailoringOrders(
  brandId: string
): Promise<TailoringOrder[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailoring_orders")
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
    console.error("Error fetching brand tailoring orders:", error);
    throw error;
  }

  return data || [];
}

/**
 * Update tailoring order status
 */
export async function updateTailoringOrderStatus(
  orderId: string,
  status: TailoringOrder["status"],
  brandNotes?: string,
  estimatedCompletion?: string
): Promise<TailoringOrder | null> {
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
    .from("tailoring_orders")
    .update(updateData)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error updating tailoring order status:", error);
    throw error;
  }

  return data;
}

/**
 * Get a single tailoring order by ID
 */
export async function getTailoringOrderById(
  orderId: string
): Promise<TailoringOrder | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailoring_orders")
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
    console.error("Error fetching tailoring order:", error);
    return null;
  }

  return data;
}

/**
 * Calculate estimated price for custom tailoring
 * This is a basic implementation - you can make it more sophisticated
 */
export function calculateTailoringPrice(
  basePrice: number,
  isCustom: boolean = false,
  measurements?: CustomerMeasurements
): number {
  let finalPrice = basePrice;

  // Add custom tailoring fee
  if (isCustom) {
    finalPrice += basePrice * 0.3; // 30% markup for custom work
  }

  // Add complexity fee based on special requirements
  if (measurements?.special_requirements) {
    finalPrice += basePrice * 0.1; // 10% for special requirements
  }

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate order invoice data
 */
export function generateOrderInvoice(
  order: TailoringOrder,
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
    },
    brandInfo: {
      name: brand.name,
      location: brand.location,
    },
    productInfo: {
      title: product.title,
      description: product.description,
      basePrice: product.price,
      finalPrice: order.total_amount,
    },
    deliveryAddress: order.delivery_address,
    measurements: order.measurements,
    status: order.status,
    estimatedCompletion: order.estimated_completion,
    notes: {
      customer: order.customer_notes,
      brand: order.brand_notes,
    },
  };
}
