import { Suspense } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import ClientWrapper from "./ClientWrapper";

export { metadata } from "./metadata";

function DirectoryInteractiveFallback() {
  return (
    <div className="mt-8">
      <div className="text-center py-12">
        <p className="text-oma-cocoa text-lg">
          Please wait while we load designer data...
        </p>
        <div className="mx-auto mt-4 h-8 w-8 animate-spin rounded-full border-4 border-oma-plum border-t-transparent" />
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SectionHeader
          title="Brand Directory"
          subtitle="Discover talented designers and artisans"
          centered={true}
          titleClassName="font-canela text-3xl md:text-4xl"
          subtitleClassName="text-oma-cocoa/80"
        />

        <Suspense fallback={<DirectoryInteractiveFallback />}>
          <ClientWrapper />
        </Suspense>
      </div>
    </div>
  );
}
