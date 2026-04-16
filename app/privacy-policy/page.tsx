import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveLegalDocument } from "@/lib/legal/getActiveLegalDocument";

export { metadata } from "./metadata";

const SUPPORT_EMAIL = "info@oma-hub.com";
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=Privacy%20policy%20request`;

export default async function PrivacyPolicyPage() {
  const result = await getActiveLegalDocument("privacy_policy");

  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
      <header className="border-b border-oma-gold/20 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Button
            variant="ghost"
            className="mb-4 text-oma-plum hover:bg-oma-beige/50"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-oma-plum/10 p-2">
              <Shield className="h-6 w-6 text-oma-plum" aria-hidden />
            </div>
            <h1 className="heading-lg text-oma-plum">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-oma-gold/20 bg-white/90 shadow-xl backdrop-blur-sm">
          <div className="p-8 lg:p-12">
            {result.status === "error" ? (
              <div className="space-y-4 text-center text-oma-cocoa">
                <p className="text-red-700">{result.message}</p>
                <p className="text-sm">
                  You can request a copy of our privacy policy by email. We
                  will respond as soon as we can.
                </p>
                <p>
                  <a
                    href={SUPPORT_MAILTO}
                    className="font-medium text-oma-plum underline-offset-4 hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>
            ) : (
              <>
                {result.status === "fallback" && result.notice && (
                  <p
                    className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                    role="status"
                  >
                    {result.notice}
                  </p>
                )}
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: result.doc.contentHtml ?? "",
                  }}
                />
                <p className="mt-10 border-t border-oma-gold/20 pt-6 text-center text-sm text-oma-cocoa/90">
                  Questions about this policy?{" "}
                  <a
                    href={SUPPORT_MAILTO}
                    className="font-medium text-oma-plum underline-offset-4 hover:underline"
                  >
                    Contact {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
