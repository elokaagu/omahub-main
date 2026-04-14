export type LegalDocumentType = "privacy_policy" | "terms_of_service";

/** Row shape from `legal_documents` (and defaults) used on public legal pages. */
export type LegalDocumentRow = {
  id: string;
  document_type: LegalDocumentType;
  title: string;
  content: string;
  effective_date: string;
  version: number;
  is_active: boolean;
};

/** Safe for rendering after HTML sanitization. */
export type LegalDocumentForRender = Omit<LegalDocumentRow, "content"> & {
  contentHtml: string;
};
