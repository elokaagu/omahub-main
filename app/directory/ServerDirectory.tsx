import { SectionHeader } from "@/components/ui/section-header";

export default function ServerDirectory() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <SectionHeader
          title="Designer Directory"
          subtitle="Discover talented designers and artisans"
          centered={true}
          titleClassName="font-canela text-3xl md:text-4xl"
          subtitleClassName="text-oma-cocoa/80"
        />
      </div>
    </div>
  );
}
