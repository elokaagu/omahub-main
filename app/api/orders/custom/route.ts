import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { extractCurrencyFromPriceRange } from "@/lib/utils/priceFormatter";
import {
  checkCustomOrderRateLimit,
  getCustomOrderClientKey,
} from "@/lib/rate-limit/customOrderRateLimit";
import {
  isCustomOrderHoneypotTriggered,
  parseCustomOrderBody,
} from "@/lib/validation/customOrderBody";

function normalizeAmount(v: number | null | undefined, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
}

function normalizeCurrency(brandPriceRange: string | null | undefined): string {
  const parsed = extractCurrencyFromPriceRange(brandPriceRange || "");
  const c = parsed?.trim().toUpperCase();
  return c && /^[A-Z]{3}$/.test(c) ? c : "USD";
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (isCustomOrderHoneypotTriggered(raw)) {
    return NextResponse.json({ success: true, message: "Order submitted successfully" });
  }

  if (!checkCustomOrderRateLimit(getCustomOrderClientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const parsed = parseCustomOrderBody(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const {
    user_id,
    product_id,
    brand_id,
    customer_notes,
    delivery_address,
    total_amount,
    size,
    color,
    quantity,
    measurements,
  } = parsed.data;

  const admin = await getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const [productResult, brandResult] = await Promise.all([
    admin
      .from("products")
      .select("id, title, price, sale_price, brand_id")
      .eq("id", product_id)
      .single(),
    admin
      .from("brands")
      .select("id, name, contact_email, user_id, price_range")
      .eq("id", brand_id)
      .single(),
  ]);

  if (productResult.error || brandResult.error || !productResult.data || !brandResult.data) {
    return NextResponse.json({ error: "Invalid product or brand" }, { status: 400 });
  }

  const product = productResult.data;
  const brand = brandResult.data;

  if (product.brand_id !== brand_id) {
    return NextResponse.json(
      { error: "Product does not belong to brand" },
      { status: 400 }
    );
  }

  let finalUserId: string | null = null;

  if (user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .maybeSingle();
    finalUserId = profile?.id ?? null;
  }

  if (!finalUserId) {
    // Prefer signed-in user if available; otherwise resolve existing profile by email.
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await serverSupabase.auth.getUser();

    if (authUser?.id) {
      finalUserId = authUser.id;
    } else {
      const { data: existingByEmail } = await admin
        .from("profiles")
        .select("id")
        .eq("email", delivery_address.email.toLowerCase())
        .maybeSingle();
      finalUserId = existingByEmail?.id ?? null;
    }
  }

  if (!finalUserId) {
    // Do not create synthetic/fake identities.
    return NextResponse.json(
      { error: "Please sign in to place a custom order." },
      { status: 401 }
    );
  }

  const orderTotal = normalizeAmount(
    total_amount,
    Number(product.sale_price ?? product.price ?? 0)
  );
  const currency = normalizeCurrency(brand.price_range);

  const { data: order, error: orderError } = await admin
    .from("tailored_orders")
    .insert({
      user_id: finalUserId,
      product_id,
      brand_id,
      status: "pending",
      total_amount: orderTotal,
      currency,
      customer_notes: customer_notes || "",
      measurements,
      size,
      color,
      quantity,
      delivery_address,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, status, total_amount, currency, created_at")
    .single();

  if (orderError || !order) {
    console.error("custom_order_create_failed", orderError?.message);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const orderType = Object.keys(measurements || {}).length > 0 ? "Custom order" : "Product request";
  const source = Object.keys(measurements || {}).length > 0 ? "custom_order" : "product_request";

  // Non-critical side effects
  void admin.from("leads").insert({
    brand_id,
    customer_name: delivery_address.full_name,
    customer_email: delivery_address.email,
    customer_phone: delivery_address.phone || "",
    source,
    lead_type: "product_request",
    status: "converted",
    priority: "high",
    notes: `${orderType} for ${product.title}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  void admin.from("inquiries").insert({
    brand_id,
    customer_name: delivery_address.full_name,
    customer_email: delivery_address.email,
    customer_phone: delivery_address.phone || null,
    subject: `${orderType} Request - ${product.title}`,
    message: `${orderType} submitted for ${product.title}.`,
    inquiry_type: "product_request",
    priority: "high",
    source,
    status: "replied",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (brand.user_id) {
    void admin.from("notifications").insert({
      user_id: brand.user_id,
      brand_id,
      type: "new_order",
      title: "New Custom Order Request",
      message: `New order request for ${product.title}`,
      data: {
        order_id: order.id,
        product_id,
        product_title: product.title,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  const orderNumber = `OMH-${order.id.slice(-8).toUpperCase()}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const amountLabel = `${currency} ${orderTotal}`;

      await resend.emails.send({
        from: "OmaHub <info@oma-hub.com>",
        to: ["info@oma-hub.com"],
        subject: `New Custom Order Request - ${product.title}`,
        text: `Order ${orderNumber} for ${product.title} (${brand.name}) - ${amountLabel}`,
      });

      if (brand.contact_email && brand.contact_email !== "info@oma-hub.com") {
        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [brand.contact_email],
          subject: `New Custom Order Request - ${product.title}`,
          text: `Order ${orderNumber} submitted. Please review in Studio.`,
        });
      }

      await resend.emails.send({
        from: "OmaHub <info@oma-hub.com>",
        to: [delivery_address.email],
        subject: `Order Confirmation - ${product.title} from ${brand.name}`,
        text: `Your request ${orderNumber} was submitted successfully.`,
      });
    } catch (emailError) {
      console.error(
        "custom_order_email_failed",
        emailError instanceof Error ? emailError.message : String(emailError)
      );
    }
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber,
    message: "Order submitted successfully",
  });
}
