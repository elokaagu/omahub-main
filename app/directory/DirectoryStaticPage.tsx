import { SectionHeader } from "@/components/ui/section-header";
import dynamic from "next/dynamic";

// Dynamically load the client wrapper with no SSR
const ClientWrapper = dynamic(() => import("./ClientWrapper.tsx"), {
  ssr: false,
  loading: () => (
    <div className="mt-8">
      <div className="text-center py-12">
        <p className="text-oma-cocoa text-lg">
          Please wait while we load designer data...
        </p>
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mt-4"></div>
      </div>
    </div>
  ),
});

export default function DirectoryStaticPage() {
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

        <ClientWrapper />
      </div>
    </div>
  );
}
