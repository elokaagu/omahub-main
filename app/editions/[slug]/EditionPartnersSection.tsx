import type { EditionImage } from "@/lib/services/editionImagesService";

type EditionPartnersSectionProps = {
  partnerLogos: EditionImage[];
  staticPartnerName?: string;
};

export function EditionPartnersSection({
  partnerLogos,
  staticPartnerName,
}: EditionPartnersSectionProps) {
  const showStaticName =
    staticPartnerName &&
    !partnerLogos.some(
      (partner) =>
        partner.alt_text?.trim().toLowerCase() ===
        staticPartnerName.trim().toLowerCase(),
    );

  if (partnerLogos.length === 0 && !showStaticName) {
    return null;
  }

  return (
    <section className="border-t border-oma-cocoa/15 bg-oma-beige py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
          Our partners
        </p>

        {showStaticName && (
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-oma-cocoa">
            In partnership with {staticPartnerName}
          </p>
        )}

        {partnerLogos.length > 0 && (
          <div className="mt-6 flex flex-col gap-6 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-12 sm:gap-y-8">
            {partnerLogos.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center gap-3 sm:max-w-none"
              >
                <img
                  src={partner.image_url}
                  alt={partner.alt_text || "Partner"}
                  className="h-12 w-24 shrink-0 object-contain"
                />
                {partner.alt_text && (
                  <p className="text-sm font-medium text-oma-black">
                    {partner.alt_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
