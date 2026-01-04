"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoc() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/legal-documents?type=privacy_policy");
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
              <Shield className="h-6 w-6 text-oma-plum" />
            </div>
            <h1 className="heading-lg text-oma-plum">Privacy Policy</h1>
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
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-oma-gold/20 overflow-hidden">
          <div className="p-8 lg:p-12">
            {loading ? (
              <div className="text-center text-oma-plum py-8">
                Loading Privacy Policy...
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
                No Privacy Policy found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
