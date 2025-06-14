import { SectionHeader } from "@/components/ui/section-header";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SectionHeader
        title="Privacy Policy"
        titleClassName="font-canela text-3xl md:text-4xl"
      />

      <p className="text-sm text-oma-cocoa mb-8">
        Effective Date: <strong>1st July 2025</strong>
      </p>

      <div className="prose prose-oma max-w-none">
        <h2 className="heading-sm mb-4">1. Information We Collect</h2>
        <p className="mb-6 text-oma-cocoa">
          We collect information that you provide directly to us, including when
          you create an account, update your profile, or communicate with us.
          This may include your name, email address, phone number, and any other
          information you choose to provide.
        </p>

        <h2 className="heading-sm mb-4">2. How We Use Your Information</h2>
        <p className="mb-6 text-oma-cocoa">
          We use the information we collect to provide, maintain, and improve
          our services, to communicate with you, and to personalize your
          experience on OmaHub.
        </p>

        <h2 className="heading-sm mb-4">3. Information Sharing</h2>
        <p className="mb-6 text-oma-cocoa">
          We do not sell or rent your personal information to third parties. We
          may share your information with service providers who assist in our
          operations and with your consent.
        </p>

        <h2 className="heading-sm mb-4">4. Data Security</h2>
        <p className="mb-6 text-oma-cocoa">
          We implement appropriate technical and organizational measures to
          protect your personal information against unauthorized access,
          alteration, disclosure, or destruction.
        </p>

        <h2 className="heading-sm mb-4">5. Contact Us</h2>
        <p className="mb-6 text-oma-cocoa">
          If you have any questions about this Privacy Policy, please contact us
          at privacy@omahub.com
        </p>
      </div>
    </div>
  );
}
