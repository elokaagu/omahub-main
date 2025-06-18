import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Users,
  Shield,
  AlertTriangle,
  Mail,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-oma-gold/20 sticky top-0 z-10">
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
          <div className="flex items-center gap-4 text-sm text-oma-cocoa">
            <span className="bg-oma-beige px-3 py-1 rounded-full">
              Version 1.0
            </span>
            <span>Effective January 1, 2025</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-oma-gold/20 overflow-hidden">
          <div className="p-8 lg:p-12">
            {/* Introduction */}
            <div className="mb-12 p-6 bg-gradient-to-r from-oma-beige/50 to-oma-cream/50 rounded-xl border-l-4 border-oma-gold">
              <p className="body-lg text-oma-cocoa leading-relaxed">
                Welcome to OmaHub! These Terms of Service govern your use of our
                platform that connects fashion enthusiasts with talented
                designers and brands worldwide. By accessing or using OmaHub,
                you agree to be bound by these terms.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {/* Acceptance of Terms */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Scale className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    Acceptance of Terms
                  </h2>
                </div>
                <div className="bg-gradient-to-r from-oma-cream/20 to-oma-beige/20 p-6 rounded-xl border border-oma-gold/30">
                  <p className="body-md text-oma-cocoa mb-4">
                    By accessing and using OmaHub, you accept and agree to be
                    bound by these Terms of Service and our Privacy Policy. If
                    you do not agree to these terms, please do not use our
                    platform.
                  </p>
                  <div className="bg-white/60 p-4 rounded-lg">
                    <p className="body-sm text-oma-cocoa">
                      <strong className="text-oma-plum">Important:</strong>{" "}
                      These terms may be updated from time to time. Continued
                      use of the platform constitutes acceptance of any
                      modifications.
                    </p>
                  </div>
                </div>
              </section>

              {/* User Accounts */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Users className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">User Accounts</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-oma-cream/30 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Account Creation
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        You must provide accurate and complete information when
                        creating your account
                      </p>
                    </div>
                    <div className="p-4 bg-oma-beige/30 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Account Security
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        You are responsible for maintaining the security of your
                        account and password
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-oma-cream/30 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Account Activity
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        You are responsible for all activities that occur under
                        your account
                      </p>
                    </div>
                    <div className="p-4 bg-oma-beige/30 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Account Termination
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        Either party may terminate the account relationship at
                        any time
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Platform Rules */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Shield className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    Platform Rules & Conduct
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-oma-plum/5 to-oma-cocoa/5 p-6 rounded-xl">
                    <h3 className="font-semibold text-oma-plum mb-4">
                      You agree to:
                    </h3>
                    <ul className="space-y-3 text-oma-cocoa">
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>
                          Respect intellectual property rights of all brands and
                          designers
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>
                          Maintain professional and respectful conduct in all
                          interactions
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>
                          Provide honest and accurate reviews and feedback
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>
                          Follow our community guidelines and standards
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-4">
                      Prohibited activities include:
                    </h3>
                    <ul className="space-y-3 text-red-700">
                      <li className="flex items-start gap-3">
                        <span className="text-red-600 mt-1">✗</span>
                        <span>
                          Harassment, discrimination, or abusive behavior
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-600 mt-1">✗</span>
                        <span>
                          Posting false, misleading, or fraudulent content
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-600 mt-1">✗</span>
                        <span>
                          Attempting to circumvent platform security measures
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-600 mt-1">✗</span>
                        <span>
                          Using the platform for any illegal or unauthorized
                          purpose
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Content Ownership */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <FileText className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    Content Ownership & Licensing
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-oma-cream/30 p-6 rounded-xl">
                    <h3 className="font-semibold text-oma-plum mb-3">
                      Your Content
                    </h3>
                    <p className="body-md text-oma-cocoa mb-3">
                      You retain full ownership of all content you upload,
                      including photos, descriptions, and reviews.
                    </p>
                    <p className="body-sm text-oma-cocoa">
                      By uploading content, you grant OmaHub a non-exclusive
                      license to display and promote your content on our
                      platform.
                    </p>
                  </div>
                  <div className="bg-oma-beige/30 p-6 rounded-xl">
                    <h3 className="font-semibold text-oma-plum mb-3">
                      Platform Content
                    </h3>
                    <p className="body-md text-oma-cocoa mb-3">
                      OmaHub's design, features, and functionality are owned by
                      us and protected by intellectual property laws.
                    </p>
                    <p className="body-sm text-oma-cocoa">
                      You may not copy, modify, or distribute our platform
                      content without permission.
                    </p>
                  </div>
                </div>
              </section>

              {/* Service Modifications */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    Service Modifications & Availability
                  </h2>
                </div>
                <div className="bg-gradient-to-r from-oma-beige/20 to-oma-cream/20 p-6 rounded-xl border border-oma-gold/30">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-oma-gold rounded-full mt-2"></div>
                      <p className="body-md text-oma-cocoa">
                        We reserve the right to modify, suspend, or discontinue
                        any part of our service at any time, with or without
                        notice.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-oma-gold rounded-full mt-2"></div>
                      <p className="body-md text-oma-cocoa">
                        We strive to provide reliable service but cannot
                        guarantee uninterrupted access to the platform.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-oma-gold rounded-full mt-2"></div>
                      <p className="body-md text-oma-cocoa">
                        We will make reasonable efforts to notify users of
                        significant changes to our services.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="heading-sm text-oma-plum mb-6">
                  Limitation of Liability
                </h2>
                <div className="bg-gradient-to-r from-oma-plum/5 to-oma-cocoa/5 p-6 rounded-xl border border-oma-plum/20">
                  <p className="body-md text-oma-cocoa mb-4">
                    OmaHub serves as a platform connecting users with fashion
                    brands and designers. We are not responsible for:
                  </p>
                  <ul className="space-y-2 text-oma-cocoa">
                    <li className="flex items-start gap-2">
                      <span className="text-oma-gold mt-1">•</span>
                      <span>
                        The quality, safety, or legality of products or services
                        offered by brands
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-oma-gold mt-1">•</span>
                      <span>
                        Transactions between users and brands conducted outside
                        our platform
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-oma-gold mt-1">•</span>
                      <span>
                        Disputes arising from user interactions or business
                        relationships
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="heading-sm text-oma-plum mb-6">Governing Law</h2>
                <div className="bg-oma-cream/40 p-6 rounded-xl">
                  <p className="body-md text-oma-cocoa">
                    These Terms of Service are governed by and construed in
                    accordance with applicable laws. Any disputes will be
                    resolved through appropriate legal channels in the
                    jurisdiction where OmaHub operates.
                  </p>
                </div>
              </section>
            </div>
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
            <a href="mailto:legal@oma-hub.com" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
              >
                legal@oma-hub.com
              </Button>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-oma-cocoa">
          <p className="mb-2">Last updated: January 1, 2025</p>
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

export async function generateMetadata() {
  return {
    title: "Terms of Service - OmaHub",
    description:
      "Read OmaHub's terms of service and conditions for using our global fashion platform.",
  };
}
