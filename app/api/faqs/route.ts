import { NextRequest, NextResponse } from "next/server";
import { getPublicFaqs } from "@/lib/services/publicFaqService";

export const dynamic = "force-dynamic";

/**
 * Public read-only FAQs (active only). Use instead of `/api/admin/faqs` for marketing pages.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { faqs, error } = await getPublicFaqs({
    pageLocation: searchParams.get("page_location"),
    category: searchParams.get("category"),
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ faqs });
}
