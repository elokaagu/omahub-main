import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Sanitize admin-authored legal HTML before `dangerouslySetInnerHTML`.
 * Strips scripts, event handlers, and other XSS vectors while keeping typical rich text.
 *
 * Uses `sanitize-html` (htmlparser2) instead of `isomorphic-dompurify` / jsdom so the
 * server bundle avoids `html-encoding-sniffer` → `@exodus/bytes` ESM/CJS issues on Vercel.
 */
export function sanitizeLegalDocumentHtml(dirty: unknown): string {
  const raw =
    typeof dirty === "string"
      ? dirty
      : dirty == null
        ? ""
        : String(dirty);
  try {
    const baseAttrs = sanitizeHtml.defaults.allowedAttributes;
    const linkAttrs = new Set([...(baseAttrs.a ?? []), "target", "rel"]);
    return sanitizeHtml(raw, {
      allowedTags: sanitizeHtml.defaults.allowedTags,
      allowedAttributes: {
        ...baseAttrs,
        a: Array.from(linkAttrs),
      },
      allowedSchemes: ["http", "https", "mailto", "tel"],
      allowProtocolRelative: false,
    });
  } catch (e) {
    console.error("sanitizeLegalDocumentHtml:", e);
    return "";
  }
}
