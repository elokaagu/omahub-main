import { SectionHeader } from "@/components/ui/section-header";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SectionHeader
        title="Terms of Service"
        titleClassName="font-canela text-3xl md:text-4xl"
      />

      <div className="prose prose-oma max-w-none">
        <h2 className="heading-sm mb-4">1. Acceptance of Terms</h2>
        <p className="mb-6 text-oma-cocoa">
          By accessing and using OmaHub, you accept and agree to be bound by
          these Terms of Service. If you do not agree to these terms, please do
          not use our platform.
        </p>

        <h2 className="heading-sm mb-4">2. User Accounts</h2>
        <p className="mb-6 text-oma-cocoa">
          When you create an account with us, you must provide accurate and
          complete information. You are responsible for maintaining the security
          of your account and password.
        </p>

        <h2 className="heading-sm mb-4">3. Platform Rules</h2>
        <p className="mb-6 text-oma-cocoa">
          Users must respect intellectual property rights, maintain professional
          conduct, and follow our community guidelines when using OmaHub.
        </p>

        <h2 className="heading-sm mb-4">4. Content Ownership</h2>
        <p className="mb-6 text-oma-cocoa">
          Users retain ownership of their content while granting OmaHub a
          license to display and promote the content on our platform.
        </p>

        <h2 className="heading-sm mb-4">5. Modifications to Service</h2>
        <p className="mb-6 text-oma-cocoa">
          We reserve the right to modify or discontinue our service at any time,
          with or without notice.
        </p>

        <p className="text-sm text-oma-cocoa mb-8">
          Effective Date: <strong>1st July 2025</strong>
        </p>
      </div>
    </div>
  );
}
