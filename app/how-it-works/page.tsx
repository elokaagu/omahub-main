import dynamic from "next/dynamic";

// Use dynamic import to load the client component with no SSR
const HowItWorksClient = dynamic(() => import("./HowItWorksClient"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
    </div>
  ),
});

// This is a server component
export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
