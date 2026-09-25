import type { EditionImage } from "@/lib/services/editionImagesService";
import { cn } from "@/lib/utils";

type EditionPartnersSectionProps = {
  partnerLogos: EditionImage[];
  staticPartnerName?: string;
};

function partnerHeadline(
  partnerLogos: EditionImage[],
  staticPartnerName?: string,
): string {
  const names = partnerLogos
    .map((partner) => partner.alt_text?.trim())
    .filter((name): name is string => Boolean(name));
  if (staticPartnerName?.trim()) {
    const extra = names.filter(
      (name) => name.toLowerCase() !== staticPartnerName.trim().toLowerCase(),
    );
    names.unshift(staticPartnerName.trim(), ...extra);
    names.splice(1 + extra.length);
  }

  if (names.length === 0) return "Presented with our partners";
  if (names.length === 1) return `In partnership with ${names[0]}`;
  return `In partnership with ${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function EditionPartnersSection({
  partnerLogos,
  staticPartnerName,
}: EditionPartnersSectionProps) {
  if (partnerLogos.length === 0 && !staticPartnerName?.trim()) {
    return null;
  }

  const isSingle = partnerLogos.length === 1;

  return (
    <section className="border-t border-oma-cocoa/15 bg-oma-beige py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
          Our partners
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl font-canela text-3xl leading-[1.1] text-oma-black sm:text-4xl lg:text-5xl">
          {partnerHeadline(partnerLogos, staticPartnerName)}
        </h2>
        <div className="mx-auto mt-6 h-px w-16 bg-oma-cocoa/40" aria-hidden />

        {partnerLogos.length > 0 && (
          <ul
            className={cn(
              "mx-auto mt-12 grid gap-8 sm:mt-14",
              isSingle
                ? "max-w-md grid-cols-1"
                : "max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {partnerLogos.map((partner) => (
              <li key={partner.id} className="group">
                <figure>
                  <div
                    className={cn(
                      "flex items-center justify-center overflow-hidden rounded-sm bg-white p-5 shadow-[0_20px_50px_-24px_rgba(58,30,45,0.35)] ring-1 ring-oma-cocoa/10 transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_-24px_rgba(58,30,45,0.45)] sm:p-6",
                      isSingle ? "aspect-[4/5]" : "aspect-square",
                    )}
                  >
                    <img
                      src={partner.image_url}
                      alt={partner.alt_text || "Partner"}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  {partner.alt_text && (
                    <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-oma-cocoa">
                      {partner.alt_text}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
