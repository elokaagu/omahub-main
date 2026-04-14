/**
 * Fallback legal copy when `legal_documents` is missing or has no active row.
 * Kept in sync with historical defaults from the legal-documents API.
 */
export type DefaultLegalDocument = {
  id: string;
  document_type: "terms_of_service" | "privacy_policy";
  title: string;
  content: string;
  effective_date: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const defaultLegalDocuments: DefaultLegalDocument[] = [
  {
    id: "default-terms",
    document_type: "terms_of_service",
    title: "Terms of Service",
    content: `<h2>1. Acceptance of Terms</h2>
<p>By accessing and using OmaHub, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

<h2>2. User Accounts</h2>
<p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.</p>

<h2>3. Platform Rules</h2>
<p>Users must respect intellectual property rights, maintain professional conduct, and follow our community guidelines when using OmaHub.</p>

<h2>4. Content Ownership</h2>
<p>Users retain ownership of their content while granting OmaHub a license to display and promote the content on our platform.</p>

<h2>5. Modifications to Service</h2>
<p>We reserve the right to modify or discontinue our service at any time, with or without notice.</p>`,
    effective_date: "2025-01-01",
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-privacy",
    document_type: "privacy_policy",
    title: "Privacy Policy",
    content: `<h2>1. Information We Collect</h2>
<p>We collect information that you provide directly to us, including when you create an account, update your profile, or communicate with us. This may include your name, email address, phone number, and any other information you choose to provide.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience on OmaHub.</p>

<h2>3. Information Sharing</h2>
<p>We do not sell or rent your personal information to third parties. We may share your information with service providers who assist in our operations and with your consent.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at info@oma-hub.com</p>`,
    effective_date: "2025-01-01",
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
