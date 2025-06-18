import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getPrivacyPolicy() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/legal-documents?type=privacy_policy&active=true`,
      {
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch privacy policy");
    }

    const data = await response.json();
    return data.documents?.[0] || null;
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    return null;
  }
}

export default async function PrivacyPolicyPage() {
  const document = await getPrivacyPolicy();

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
            If you have any questions about this Privacy Policy, please{" "}
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
  const document = await getPrivacyPolicy();

  return {
    title: document?.title || "Privacy Policy",
    description: "Our privacy policy and data protection practices.",
  };
}
