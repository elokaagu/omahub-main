import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn, SlideUp } from "@/app/components/ui/animations";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-oma-beige/40 via-white to-white px-6 py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center">
        <FadeIn>
          <div className="w-full overflow-hidden rounded-2xl border border-oma-gold/20 bg-white shadow-sm">
            <div className="relative h-56 w-full sm:h-72">
              <img
                src="/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png"
                alt="Curated fashion edit"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-left text-white sm:p-8">
                <p className="text-xs uppercase tracking-[0.22em] text-white/80">
                  Error 404
                </p>
                <h1 className="mt-2 font-canela text-3xl sm:text-5xl">
                  This look is off the runway.
                </h1>
              </div>
            </div>
          </div>
        </FadeIn>

        <SlideUp delay={0.1}>
          <p className="max-w-2xl text-base text-oma-cocoa sm:text-lg">
            The page you were looking for is no longer available. Explore our
            curated designers, occasion-ready collections, or return to the
            homepage.
          </p>
        </SlideUp>

        <SlideUp delay={0.15}>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/directory">Browse Designers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections">Explore Collections</Link>
            </Button>
          </div>
        </SlideUp>
      </div>
    </main>
  );
}
