type CornerVariant = "standard" | "clients" | "cta";

export function SectionCorners({ variant }: { variant: CornerVariant }) {
  if (variant === "clients") {
    return (
      <>
        <div className="absolute left-10 top-16 z-30 h-10 w-10 border-l-4 border-t-4 border-oma-gold/80 md:left-16 md:top-20" />
        <div className="absolute right-10 top-16 z-30 h-10 w-10 border-r-4 border-t-4 border-oma-gold/80 md:right-16 md:top-20" />
        <div className="absolute bottom-6 left-6 z-20 h-8 w-8 border-l-4 border-b-4 border-oma-gold/80 md:bottom-10 md:left-10 md:h-10 md:w-10" />
        <div className="absolute bottom-6 right-6 z-20 h-8 w-8 border-r-4 border-b-4 border-oma-gold/80 md:bottom-10 md:right-10 md:h-10 md:w-10" />
      </>
    );
  }
  if (variant === "cta") {
    return (
      <>
        <div className="absolute left-6 top-6 h-8 w-8 border-l-4 border-t-4 border-oma-gold/80 md:left-10 md:top-10 md:h-10 md:w-10" />
        <div className="absolute right-6 top-6 h-8 w-8 border-r-4 border-t-4 border-oma-gold/80 md:right-10 md:top-10 md:h-10 md:w-10" />
        <div className="absolute bottom-6 left-6 h-8 w-8 border-l-4 border-b-4 border-oma-gold/80 md:bottom-10 md:left-10 md:h-10 md:w-10" />
        <div className="absolute bottom-6 right-6 h-8 w-8 border-r-4 border-b-4 border-oma-gold/80 md:bottom-10 md:right-10 md:h-10 md:w-10" />
      </>
    );
  }
  return (
    <>
      <div className="absolute left-8 top-24 h-12 w-12 border-l-4 border-t-4 border-oma-gold/80" />
      <div className="absolute right-8 top-24 h-12 w-12 border-r-4 border-t-4 border-oma-gold/80" />
      <div className="absolute bottom-8 left-8 h-12 w-12 border-l-4 border-b-4 border-oma-gold/80" />
      <div className="absolute bottom-8 right-8 h-12 w-12 border-r-4 border-b-4 border-oma-gold/80" />
    </>
  );
}

type OrbPreset =
  | "hero"
  | "stackA"
  | "stackB"
  | "stackC"
  | "faq"
  | "ctaBg";

export function FloatingOrbs({ preset }: { preset: OrbPreset }) {
  if (preset === "hero") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <div className="absolute left-10 top-20 h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 blur-xl" />
        <div
          className="absolute right-20 top-40 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-oma-gold/30 to-oma-plum/30 blur-lg"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-40 left-20 h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-oma-beige/40 to-oma-plum/40 blur-md"
          style={{ animationDelay: "2s" }}
        />
      </div>
    );
  }
  if (preset === "stackA") {
    return (
      <>
        <div className="absolute left-1/4 top-8 h-24 w-24 animate-float-slow rounded-full bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 blur-2xl" />
        <div className="absolute bottom-12 right-12 h-8 w-8 animate-bounce rounded-full bg-oma-gold shadow-lg" />
        <div className="absolute right-0 top-1/2 h-4 w-4 animate-ping rounded-full bg-oma-plum" />
        <div className="absolute bottom-1/3 left-0 h-3 w-3 animate-pulse rounded-full bg-oma-beige" />
      </>
    );
  }
  if (preset === "stackB") {
    return (
      <>
        <div className="absolute right-1/4 top-10 h-20 w-20 animate-float-slow rounded-full bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 blur-2xl" />
        <div className="absolute bottom-16 left-16 h-7 w-7 animate-bounce rounded-full bg-oma-plum shadow-lg" />
        <div className="absolute left-0 top-1/3 h-4 w-4 animate-ping rounded-full bg-oma-gold" />
        <div className="absolute bottom-1/2 right-0 h-3 w-3 animate-pulse rounded-full bg-oma-beige" />
      </>
    );
  }
  if (preset === "stackC") {
    return (
      <>
        <div className="absolute left-1/3 top-6 h-16 w-16 animate-float-slow rounded-full bg-gradient-to-br from-oma-gold/30 to-oma-plum/10 blur-2xl" />
        <div className="absolute bottom-10 right-20 h-10 w-10 animate-bounce rounded-full bg-oma-plum shadow-lg" />
        <div className="absolute right-0 top-2/3 h-4 w-4 animate-ping rounded-full bg-oma-gold" />
        <div className="absolute bottom-1/4 left-0 h-3 w-3 animate-pulse rounded-full bg-oma-beige" />
      </>
    );
  }
  if (preset === "faq") {
    return (
      <>
        <div className="absolute left-1/4 top-10 h-20 w-20 animate-float-slow rounded-full bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 blur-2xl" />
        <div className="absolute bottom-16 right-16 h-10 w-10 animate-bounce rounded-full bg-oma-plum/30 shadow-lg" />
        <div className="absolute right-0 top-1/3 h-5 w-5 animate-ping rounded-full bg-oma-gold/30" />
        <div className="absolute bottom-1/2 left-0 h-4 w-4 animate-pulse rounded-full bg-oma-beige/40" />
      </>
    );
  }
  if (preset === "ctaBg") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 blur-2xl" />
        <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-oma-gold/10 to-oma-plum/10 blur-xl" />
      </div>
    );
  }
  return null;
}
