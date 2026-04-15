import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize admin-authored legal HTML before `dangerouslySetInnerHTML`.
 * Strips scripts, event handlers, and other XSS vectors while keeping typical rich text.
 */
export function sanitizeLegalDocumentHtml(dirty: unknown): string {
  const raw =
    typeof dirty === "string"
      ? dirty
      : dirty == null
        ? ""
        : String(dirty);
  try {
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
      ALLOW_DATA_ATTR: false,
    });
  } catch (e) {
    console.error("sanitizeLegalDocumentHtml:", e);
    return "";
  }
}
