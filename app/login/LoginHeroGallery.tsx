import Image from "next/image";

type Frame = {
  src: string;
  alt: string;
  box: string;
  sizes: string;
  priority?: boolean;
};

const FRAMES: Frame[] = [
  {
    src: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    alt: "Curated African fashion styling",
    box: "absolute left-0 top-[2%] aspect-[4/5] w-[52%] -rotate-2 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5",
    sizes: "(min-width: 1024px) 22vw, 0px",
    priority: true,
  },
  {
    src: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
    alt: "Designer occasion wear",
    box: "absolute right-0 top-[20%] z-[1] aspect-[4/5] w-[58%] rotate-1 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5",
    sizes: "(min-width: 1024px) 26vw, 0px",
  },
  {
    src: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    alt: "African fashion on OmaHub",
    box: "absolute bottom-[2%] left-[5%] aspect-[5/4] w-[48%] -rotate-1 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5",
    sizes: "(min-width: 1024px) 20vw, 0px",
  },
];

export function LoginHeroGallery() {
  return (
    <div className="relative hidden h-full min-h-[calc(100vh-5rem)] flex-1 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F2F0EC] to-oma-beige/40 px-10 py-14 lg:flex xl:px-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 28%, rgba(58,30,45,0.07) 0%, transparent 42%), radial-gradient(circle at 82% 72%, rgba(212,178,133,0.14) 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto mt-4 h-[min(70vh,680px)] w-full max-w-xl flex-1">
        {FRAMES.map((item) => (
          <div key={item.src} className={item.box}>
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes={item.sizes}
              priority={item.priority ?? false}
            />
          </div>
        ))}
      </div>

      <div className="relative z-[2] mt-10 max-w-md space-y-1.5 text-oma-black">
        <p className="font-canela text-xl leading-snug tracking-tight text-oma-plum md:text-2xl">
          Fashion that feels curated, not crowded.
        </p>
        <p className="text-sm text-oma-cocoa/90">
          Discover designers and tailors on{" "}
          <span className="font-semibold text-oma-plum">OmaHub</span>
        </p>
      </div>
    </div>
  );
}
