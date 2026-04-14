import { notFound } from "next/navigation";
import { AuthModalDemo } from "@/components/ui/auth-modal-demo";

export default function AuthModalDemoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream to-oma-beige py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-oma-plum mb-4">
            Auth modal (dev demo)
          </h1>
          <p className="text-xl text-oma-cocoa max-w-2xl mx-auto">
            Internal sandbox for the shared auth modal component. Not available
            in production.
          </p>
        </div>

        <AuthModalDemo />

        <div className="mt-12 text-center">
          <p className="text-sm text-oma-cocoa">
            Use this page locally to review layout and modal behaviour; real
            auth flows use `/auth/callback` and your sign-in routes.
          </p>
        </div>
      </div>
    </div>
  );
}
