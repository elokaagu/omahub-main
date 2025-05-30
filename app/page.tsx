import dynamic from "next/dynamic";

// Dynamic import for client component
const HomeContent = dynamic(() => import("./HomeContent.tsx"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
    </div>
  ),
});

// This is a Server Component
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white">
      <HomeContent />
    </main>
  );
}
