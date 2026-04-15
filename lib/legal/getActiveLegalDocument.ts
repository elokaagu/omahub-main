import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { defaultLegalDocuments } from "./defaultLegalDocuments";
import type { LegalDocumentForRender, LegalDocumentType } from "./legalDocument";
import { sanitizeLegalDocumentHtml } from "./sanitizeLegalDocumentHtml";

export type ActiveLegalDocumentResult =
  | { status: "ok"; doc: LegalDocumentForRender }
  | { status: "fallback"; doc: LegalDocumentForRender; notice?: string }
  | { status: "error"; message: string };

function defaultDocForType(
  type: LegalDocumentType
): LegalDocumentForRender | null {
  const row = defaultLegalDocuments.find(
    (d) => d.document_type === type && d.is_active
  );
  if (!row) return null;
  return {
    id: row.id,
    document_type: row.document_type,
    title: row.title,
    effective_date: row.effective_date,
    version: row.version,
    is_active: row.is_active,
    contentHtml: sanitizeLegalDocumentHtml(row.content),
  };
}

function rowToRender(
  row: {
    id: string;
    document_type: string;
    title: string;
    content: unknown;
    effective_date: string;
    version: number | string;
    is_active: boolean;
  },
  expectedType: LegalDocumentType
): LegalDocumentForRender | null {
  if (row.document_type !== expectedType) return null;
  const version =
    typeof row.version === "number"
      ? row.version
      : parseInt(String(row.version), 10) || 1;
  const effectiveDate =
    row.effective_date != null && String(row.effective_date).trim() !== ""
      ? String(row.effective_date)
      : "2025-01-01";
  return {
    id: row.id,
    document_type: expectedType,
    title: String(row.title ?? "Legal document"),
    effective_date: effectiveDate,
    version,
    is_active: row.is_active,
    contentHtml: sanitizeLegalDocumentHtml(row.content),
  };
}

/**
 * Load the newest active legal document of `type` for public pages (server-only).
 */
export async function getActiveLegalDocument(
  type: LegalDocumentType
): Promise<ActiveLegalDocumentResult> {
  let fallback: LegalDocumentForRender | null;
  try {
    fallback = defaultDocForType(type);
  } catch (e) {
    console.error("getActiveLegalDocument default doc:", e);
    return {
      status: "error",
      message:
        "Something went wrong while preparing this page. Please refresh or contact support.",
    };
  }

  if (!fallback) {
    return {
      status: "error",
      message: "Legal document configuration is missing.",
    };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Public legal pages should still render when preview env is incomplete.
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        status: "fallback",
        doc: fallback,
        notice:
          "Showing default policy text while document storage is temporarily unavailable.",
      };
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("legal_documents")
      .select(
        "id, document_type, title, content, effective_date, version, is_active"
      )
      .eq("document_type", type)
      .eq("is_active", true)
      // Prefer columns that exist on all schema versions (avoid `created_at` if missing).
      .order("effective_date", { ascending: false })
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && (error.code === "PGRST116" || error.code === "42P01")) {
      return {
        status: "fallback",
        doc: fallback,
        notice:
          "Showing default policy text while the legal documents database table is not available.",
      };
    }

    if (error) {
      console.error(
        "getActiveLegalDocument:",
        error.message,
        error.code ?? ""
      );
      return {
        status: "fallback",
        doc: fallback,
        notice:
          "Showing default policy text because the published document could not be loaded from our servers.",
      };
    }

    if (!data) {
      return {
        status: "fallback",
        doc: fallback,
        notice:
          "No published version was found. Showing default policy text until one is published in Studio.",
      };
    }

    const rendered = rowToRender(data, type);
    if (!rendered) {
      return { status: "fallback", doc: fallback };
    }

    return { status: "ok", doc: rendered };
  } catch (e) {
    console.error("getActiveLegalDocument unexpected:", e);
    return {
      status: "fallback",
      doc: fallback,
      notice:
        "Showing default policy text after an unexpected error while loading the published document.",
    };
  }
}
