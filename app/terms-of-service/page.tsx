"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Scale,
  Users,
  Shield,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoc() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/legal-documents?type=terms_of_service");
        const data = await res.json();
        if (res.ok && data.documents) {
          const active = data.documents.find((d: any) => d.is_active);
          setDoc(active || null);
        } else {
          setError(data.error || "Failed to load document");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-oma-gold/20 rounded-t-2xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-4 hover:bg-oma-beige/50 text-oma-plum"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-oma-plum/10 rounded-lg">
              <FileText className="h-6 w-6 text-oma-plum" />
            </div>
            <h1 className="heading-lg text-oma-plum">Terms of Service</h1>
          </div>
          {doc && (
            <div className="flex items-center gap-4 text-sm text-oma-cocoa">
              <span className="bg-oma-beige px-3 py-1 rounded-full">
                Version {doc.version}
              </span>
              <span>
                Effective {new Date(doc.effective_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-oma-gold/20 overflow-hidden">
          <div className="p-8 lg:p-12">
            {loading ? (
              <div className="text-center text-oma-plum py-8">
                Loading Terms of Service...
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : doc ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: doc.content }}
              />
            ) : (
              <div className="text-center text-black/60 py-8">
                No Terms of Service found.
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-oma-gold/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-oma-plum/10 rounded-lg">
              <Mail className="h-5 w-5 text-oma-plum" />
            </div>
            <h2 className="heading-sm text-oma-plum">
              Questions About These Terms?
            </h2>
          </div>
          <p className="body-md text-oma-cocoa mb-6">
            If you have any questions about these Terms of Service or need
            clarification on any policies, please don't hesitate to contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="flex-1">
              <Button className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white">
                Contact Us
              </Button>
            </Link>
            <a href="mailto:info@oma-hub.com" className="flex-1">
              <Button className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white">
                <Mail className="h-4 w-4 mr-2" />
                info@oma-hub.com
              </Button>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-oma-cocoa">
          <p className="mb-2">Last updated: 1 January 2026</p>
          <p>
            These Terms work together with our{" "}
            <Link
              href="/privacy-policy"
              className="text-oma-plum hover:underline font-medium"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
