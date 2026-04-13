import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeInquiryMessage } from "@/lib/contact/analyzeInquiryMessage";
import { getOmaHubPlatformBrandId } from "@/lib/config/platformBrand";
import {
  leadPrioritySchema,
  leadTypeSchema,
} from "@/lib/validation/adminLeads";
import { sendContactEmail } from "@/lib/services/emailService";
import type { BrandContactParsed, GeneralContactParsed } from "@/lib/validation/contactPostBody";

function logContactEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined>
) {
  console.error(JSON.stringify({ event, ...fields }));
}

function safeLeadType(raw: string) {
  const r = leadTypeSchema.safeParse(raw);
  return r.success ? r.data : "inquiry";
}

function safePriority(raw: string) {
  const r = leadPrioritySchema.safeParse(raw);
  return r.success ? r.data : "normal";
}

export type BrandContactResult = {
  message: string;
  inquiryId: string | null;
  leadSaved: boolean;
  notificationSent: boolean;
};

export type GeneralContactResult = {
  message: string;
  inquiryId: string | null;
  leadSaved: boolean;
  notificationSent: boolean;
};

export async function submitBrandContact(
  supabase: SupabaseClient,
  input: BrandContactParsed
): Promise<BrandContactResult> {
  const { name, email, message, brandId } = input;

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, category, contact_email")
    .eq("id", brandId)
    .single();

  if (brandError || !brand) {
    logContactEvent("contact_brand_lookup_failed", {
      code: brandError?.code ?? "none",
    });
    throw new ContactSubmissionError("Brand not found", 404);
  }

  const contactEmail = brand.contact_email || "info@oma-hub.com";
  const usedOmaHubEmailFallback = !brand.contact_email;

  const analysis = analyzeInquiryMessage(
    message,
    "customer_inquiry",
    brand.category ?? undefined
  );

  let inquiryId: string | null = null;

  const { data: inquiryRow, error: inquiryError } = await supabase
    .from("inquiries")
    .insert({
      brand_id: brandId,
      customer_name: name,
      customer_email: email,
      subject: `Inquiry from ${name}`,
      message,
      inquiry_type: "customer_inquiry",
      priority: "normal",
      source: "website",
      status: "new",
    })
    .select("id")
    .single();

  if (inquiryError) {
    logContactEvent("contact_inquiry_insert_failed", {
      code: inquiryError.code ?? "unknown",
    });
  } else if (inquiryRow?.id) {
    inquiryId = inquiryRow.id;
  }

  let leadSaved = false;
  const { error: leadError } = await supabase.from("leads").insert({
    brand_id: brandId,
    customer_name: name,
    customer_email: email,
    customer_phone: "",
    source: "website",
    lead_type: safeLeadType(analysis.leadType),
    status: "new",
    priority: safePriority(analysis.priority),
    estimated_value: analysis.estimatedValue,
    project_timeline: analysis.projectTimeline,
    notes: `Contact form inquiry: ${message}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (leadError) {
    logContactEvent("contact_lead_insert_failed", {
      code: leadError.code ?? "unknown",
    });
  } else {
    leadSaved = true;
  }

  let notificationSent = false;
  try {
    const emailResult = await sendContactEmail({
      name,
      email,
      subject: `New Customer Inquiry - ${name}`,
      message: `You have a new inquiry from ${name} about your designs.

Customer Email: ${email}
Message: ${message}

This inquiry has been saved to your Studio inbox. You can respond directly to the customer at ${email}.

View all inquiries in your Studio: https://oma-hub.com/studio/inbox?brand=${brandId}

Best regards,
OmaHub Team`,
      to: contactEmail,
    });
    notificationSent = !!emailResult.success;
    if (!emailResult.success) {
      logContactEvent("contact_brand_email_failed", { ok: false });
    }
  } catch {
    logContactEvent("contact_brand_email_exception", { ok: false });
  }

  const messageOut = usedOmaHubEmailFallback
    ? "Your message has been sent! We'll forward it to the designer and get back to you soon."
    : "Your message has been sent! The designer will receive it in their inbox and respond to you directly.";

  return {
    message: messageOut,
    inquiryId,
    leadSaved,
    notificationSent,
  };
}

export async function submitGeneralContact(
  supabase: SupabaseClient,
  input: GeneralContactParsed
): Promise<GeneralContactResult> {
  const { name, email, subject, message } = input;
  const platformBrandId = getOmaHubPlatformBrandId();

  const analysis = analyzeInquiryMessage(
    `${subject}\n${message}`,
    "platform_contact",
    undefined
  );

  let inquiryId: string | null = null;

  const { data: inquiryRow, error: inquiryError } = await supabase
    .from("inquiries")
    .insert({
      brand_id: platformBrandId,
      customer_name: name,
      customer_email: email,
      subject,
      message,
      inquiry_type: "platform_contact",
      priority: "normal",
      source: "platform_contact_form",
      status: "new",
    })
    .select("id")
    .single();

  if (inquiryError) {
    logContactEvent("contact_platform_inquiry_insert_failed", {
      code: inquiryError.code ?? "unknown",
    });
  } else if (inquiryRow?.id) {
    inquiryId = inquiryRow.id;
  }

  let leadSaved = false;
  const { error: leadError } = await supabase.from("leads").insert({
    brand_id: platformBrandId,
    customer_name: name,
    customer_email: email,
    customer_phone: "",
    source: "platform_contact_form",
    status: "new",
    priority: safePriority(analysis.priority),
    lead_type: safeLeadType(analysis.leadType),
    estimated_value: analysis.estimatedValue,
    project_timeline: analysis.projectTimeline,
    notes: `General platform contact: ${subject}\n\n${message}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (leadError) {
    logContactEvent("contact_platform_lead_insert_failed", {
      code: leadError.code ?? "unknown",
    });
  } else {
    leadSaved = true;
  }

  let notificationSent = false;
  try {
    const emailResult = await sendContactEmail({
      name,
      email,
      subject: `Platform Contact: ${subject}`,
      message: `New general platform contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}

View all inquiries in your Studio: https://oma-hub.com/studio/inbox`,
    });
    notificationSent = !!emailResult.success;
    if (!emailResult.success) {
      logContactEvent("contact_platform_email_failed", { ok: false });
    }
  } catch {
    logContactEvent("contact_platform_email_exception", { ok: false });
  }

  return {
    message: "Thank you for contacting us! We'll get back to you soon.",
    inquiryId,
    leadSaved,
    notificationSent,
  };
}

export class ContactSubmissionError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ContactSubmissionError";
  }
}
