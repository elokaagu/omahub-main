import dynamic from "next/dynamic";
import { Loading } from "@/components/ui/loading";
import { StructuredData } from "@/components/seo/StructuredData";
import { getHomeBootstrapPayload } from "@/lib/home/getHomeBootstrapPayload";

const HomeContent = dynamic(() => import("./HomeContent"), {
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <Loading size="lg" />
    </div>
  ),
});

export const revalidate = 120;

export default async function Home() {
  let initialBootstrap = null;
  try {
    initialBootstrap = await getHomeBootstrapPayload();
  } catch (e) {
    console.error("home_bootstrap_page_error", e);
  }

  return (
    <>
      <StructuredData
        type="organization"
        data={{
          name: "OmaHub",
          description:
            "Premium fashion and tailoring platform connecting Africa's finest designers with a global audience",
          url: "https://www.oma-hub.com",
          logo: "https://www.oma-hub.com/logo.png",
        }}
      />
      <StructuredData
        type="website"
        data={{
          name: "OmaHub",
          url: "https://www.oma-hub.com",
          description: "Premium fashion and tailoring platform",
        }}
      />
      <main className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white">
        <HomeContent initialBootstrap={initialBootstrap} />
      </main>
    </>
  );
}
