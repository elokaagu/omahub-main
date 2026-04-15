import Image from "next/image";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoginForm } from "./LoginForm";
import { LoginHeroGalleryClient } from "./LoginHeroGalleryClient";
import { getLoginHeroBrandSlides } from "@/lib/brands/getLoginHeroBrandSlides";

const MOBILE_FALLBACK_IMAGE =
  "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png";

function LoginWordmark() {
  return (
    <Link
      href="/"
      className="mb-8 flex justify-center transition-opacity hover:opacity-90 lg:justify-start"
    >
      <Image
        src="/lovable-uploads/omahub-logo.png"
        alt="OmaHub — home"
        width={140}
        height={36}
        className="h-8 w-auto brightness-0"
        priority
      />
    </Link>
  );
}

export default async function LoginPage() {
  const heroSlides = await getLoginHeroBrandSlides();
  const mobileCover = heroSlides[0]?.imageUrl ?? MOBILE_FALLBACK_IMAGE;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full flex-col bg-[#FAF9F6] lg:flex-row lg:min-h-[calc(100dvh-5rem)]">
      {/* Form column */}
      <section className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <LoginWordmark />

          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-canela text-4xl tracking-tight text-oma-plum sm:text-[2.75rem]">
              Welcome back
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-oma-cocoa sm:text-base">
              Enter your credentials, or{" "}
              <Link
                href="/signup"
                className="font-semibold text-oma-plum underline-offset-4 hover:underline"
              >
                sign up
              </Link>{" "}
              to join OmaHub.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_24px_80px_-24px_rgba(58,30,45,0.18)] sm:p-8">
            <ErrorBoundary>
              <LoginForm />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      <LoginHeroGalleryClient slides={heroSlides} />

      {/* Mobile hero strip — first live brand cover when available */}
      <div className="relative mt-2 h-44 w-full shrink-0 overflow-hidden rounded-t-3xl lg:hidden">
        <Image
          src={mobileCover}
          alt={
            heroSlides[0]
              ? `${heroSlides[0].brandName} on OmaHub`
              : "OmaHub curated fashion"
          }
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-oma-plum/80 via-oma-plum/25 to-transparent" />
        <p className="absolute bottom-4 left-5 right-5 font-canela text-lg text-white drop-shadow-sm">
          Curated African fashion &amp; bespoke tailoring
        </p>
      </div>
    </div>
  );
}
