/**
 * Between-editions hero: just the OmaHub short film, full-bleed, cinematic.
 */
export function EditorialHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-oma-plum">
      {/* Hero film — full-bleed, muted, looping, chromeless (Vimeo background mode) */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden motion-reduce:hidden"
      >
        <iframe
          src="https://player.vimeo.com/video/1206857643?background=1&autoplay=1&loop=1&muted=1&app_id=122963"
          title="Art Of Adornment — OmaHub short film"
          allow="autoplay; fullscreen"
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </section>
  );
}
