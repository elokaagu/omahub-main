import Link from "next/link";
import { ArrowLeft, Shield, Eye, Lock, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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
              <Shield className="h-6 w-6 text-oma-plum" />
            </div>
            <h1 className="heading-lg text-oma-plum">Privacy Policy</h1>
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
                At OmaHub, we respect your privacy and are committed to
                protecting your personal information. This Privacy Policy
                explains how we collect, use, and safeguard your data when you
                use our platform to discover and connect with fashion brands and
                designers worldwide.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {/* Information We Collect */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Eye className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    Information We Collect
                  </h2>
                </div>
                <div className="space-y-4 text-oma-cocoa">
                  <div className="bg-oma-cream/30 p-6 rounded-xl">
                    <h3 className="font-semibold text-oma-plum mb-3">
                      Personal Information
                    </h3>
                    <p className="body-md">
                      When you create an account, we collect information such as
                      your name, email address, phone number, and profile
                      details to provide you with personalized services.
                    </p>
                  </div>
                  <div className="bg-oma-beige/30 p-6 rounded-xl">
                    <h3 className="font-semibold text-oma-plum mb-3">
                      Usage Information
                    </h3>
                    <p className="body-md">
                      We collect information about how you interact with our
                      platform, including pages visited, search queries, and
                      engagement with brands and products.
                    </p>
                  </div>
                  <div className="bg-oma-cream/30 p-6 rounded-xl">
                    <h3 className="font-semibold text-oma-plum mb-3">
                      Communication Data
                    </h3>
                    <p className="body-md">
                      When you contact brands, leave reviews, or communicate
                      through our platform, we may store these interactions to
                      improve our services.
                    </p>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Users className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    How We Use Your Information
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-oma-gold/20 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Service Provision
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        To provide, maintain, and improve our platform services
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-oma-gold/20 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Communication
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        To send important updates, notifications, and respond to
                        inquiries
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-oma-gold/20 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Personalization
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        To customize your experience and show relevant brands
                        and products
                      </p>
                    </div>
                    <div className="p-4 bg-white border border-oma-gold/20 rounded-lg">
                      <h3 className="font-semibold text-oma-plum mb-2">
                        Analytics
                      </h3>
                      <p className="body-sm text-oma-cocoa">
                        To analyze usage patterns and improve our platform
                        performance
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Information Sharing */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Users className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">
                    Information Sharing
                  </h2>
                </div>
                <div className="bg-gradient-to-r from-oma-beige/20 to-oma-cream/20 p-6 rounded-xl border border-oma-gold/30">
                  <p className="body-md text-oma-cocoa mb-4">
                    We do not sell or rent your personal information to third
                    parties. We may share your information only in the following
                    circumstances:
                  </p>
                  <ul className="space-y-2 text-oma-cocoa">
                    <li className="flex items-start gap-2">
                      <span className="text-oma-gold mt-1">•</span>
                      <span>
                        With brands and designers when you initiate contact or
                        inquiries
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-oma-gold mt-1">•</span>
                      <span>
                        With service providers who assist in our operations
                        under strict confidentiality agreements
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-oma-gold mt-1">•</span>
                      <span>
                        When required by law or to protect our rights and users'
                        safety
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-oma-plum/10 rounded-lg">
                    <Lock className="h-5 w-5 text-oma-plum" />
                  </div>
                  <h2 className="heading-sm text-oma-plum">Data Security</h2>
                </div>
                <div className="bg-gradient-to-r from-oma-plum/5 to-oma-cocoa/5 p-6 rounded-xl border border-oma-plum/20">
                  <p className="body-md text-oma-cocoa">
                    We implement robust technical and organizational measures to
                    protect your personal information against unauthorized
                    access, alteration, disclosure, or destruction. This
                    includes encryption, secure servers, and regular security
                    audits.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="heading-sm text-oma-plum mb-6">Your Rights</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-oma-cream/40 rounded-lg">
                    <h3 className="font-semibold text-oma-plum mb-2">
                      Access & Update
                    </h3>
                    <p className="body-sm text-oma-cocoa">
                      You can access and update your personal information
                      through your account settings.
                    </p>
                  </div>
                  <div className="p-4 bg-oma-beige/40 rounded-lg">
                    <h3 className="font-semibold text-oma-plum mb-2">
                      Data Deletion
                    </h3>
                    <p className="body-sm text-oma-cocoa">
                      You can request deletion of your account and associated
                      data at any time.
                    </p>
                  </div>
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
            <h2 className="heading-sm text-oma-plum">Contact Us</h2>
          </div>
          <p className="body-md text-oma-cocoa mb-6">
            If you have any questions about this Privacy Policy or our data
            practices, please don't hesitate to contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="flex-1">
              <Button className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white">
                Contact Us
              </Button>
            </Link>
            <a href="mailto:privacy@oma-hub.com" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
              >
                privacy@oma-hub.com
              </Button>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-oma-cocoa">
          <p className="mb-2">Last updated: January 1, 2025</p>
          <p>
            This Privacy Policy is part of our{" "}
            <Link
              href="/terms-of-service"
              className="text-oma-plum hover:underline font-medium"
            >
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Privacy Policy - OmaHub",
    description:
      "Learn how OmaHub protects your privacy and handles your personal information on our global fashion platform.",
  };
}
