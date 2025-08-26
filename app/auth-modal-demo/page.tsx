import { AuthModalDemo } from "@/components/ui/auth-modal-demo";

export default function AuthModalDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream to-oma-beige py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-oma-plum mb-4">
            OmaHub Authentication Modal
          </h1>
          <p className="text-xl text-oma-cocoa max-w-2xl mx-auto">
            Experience the beautiful, integrated authentication modal that
            replaces browser alerts and provides a seamless user experience
            within your OmaHub application.
          </p>
        </div>

        <AuthModalDemo />

        <div className="mt-12 text-center">
          <p className="text-oma-cocoa">
            This modal integrates seamlessly with your existing authentication
            system and provides a consistent user experience across all devices.
          </p>
        </div>
      </div>
    </div>
  );
}
