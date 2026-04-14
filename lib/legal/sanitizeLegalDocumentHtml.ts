import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize admin-authored legal HTML before `dangerouslySetInnerHTML`.
 * Strips scripts, event handlers, and other XSS vectors while keeping typical rich text.
 */
export function sanitizeLegalDocumentHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}
