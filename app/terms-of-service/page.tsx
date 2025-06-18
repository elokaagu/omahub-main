import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getTermsOfService() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/legal-documents?type=terms_of_service&active=true`,
      {
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch terms of service, using fallback");
      // Return a basic fallback terms of service
      return {
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
<p>We reserve the right to modify or discontinue our service at any time, with or without notice.</p>

<h2>6. Contact Information</h2>
<p>If you have any questions about these Terms of Service, please contact us at info@oma-hub.com</p>`,
        version: "1.0",
        effective_date: "2025-01-01",
        updated_at: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return (
      data.documents?.[0] || {
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
<p>We reserve the right to modify or discontinue our service at any time, with or without notice.</p>

<h2>6. Contact Information</h2>
<p>If you have any questions about these Terms of Service, please contact us at info@oma-hub.com</p>`,
        version: "1.0",
        effective_date: "2025-01-01",
        updated_at: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Error fetching terms of service:", error);
    // Return fallback terms of service instead of null
    return {
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
<p>We reserve the right to modify or discontinue our service at any time, with or without notice.</p>

<h2>6. Contact Information</h2>
<p>If you have any questions about these Terms of Service, please contact us at info@oma-hub.com</p>`,
      version: "1.0",
      effective_date: "2025-01-01",
      updated_at: new Date().toISOString(),
    };
  }
}

export default async function TermsOfServicePage() {
  const document = await getTermsOfService();

  // Document should always exist now due to fallback
  if (!document) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
          <div className="mt-2 text-sm text-gray-600">
            <span>Version {document.version}</span>
            <span className="mx-2">•</span>
            <span>
              Effective {new Date(document.effective_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Last updated: {new Date(document.updated_at).toLocaleDateString()}
          </p>
          <p className="mt-2">
            If you have any questions about these Terms of Service, please{" "}
            <Link href="/contact" className="text-oma-plum hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const document = await getTermsOfService();

  return {
    title: document?.title || "Terms of Service",
    description: "Our terms of service and conditions of use.",
  };
}
