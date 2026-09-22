import { Globe, Instagram, Mail } from "lucide-react";
import { formatPriceRangeWithCommas } from "@/lib/utils/priceFormatter";
import type { BrandProfileData } from "./types";

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function instagramUrl(handle: string): string {
  return handle.startsWith("http")
    ? handle
    : `https://instagram.com/${handle.replace(/^@/, "")}`;
}

/** "https://instagram.com/name?igsh=..." -> "@name". */
function instagramHandle(raw: string): string {
  const withoutHost = raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  const handle = withoutHost.split(/[/?#]/)[0].replace(/^@/, "");
  return handle ? `@${handle}` : raw;
}

function websiteUrl(raw: string): string {
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

function websiteLabel(raw: string): string {
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** The designer's story, with the practical details beside it. */
export function BrandAbout({ brand }: { brand: BrandProfileData }) {
  const story = paragraphs(brand.longDescription || brand.description || "");
  const details = [
    brand.category && { label: "Category", value: brand.category },
    brand.location && { label: "Location", value: brand.location },
    brand.priceRange && {
      label: "Price range",
      value: formatPriceRangeWithCommas(brand.priceRange),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const links = [
    brand.instagram && {
      label: "Instagram",
      href: instagramUrl(brand.instagram),
      text: instagramHandle(brand.instagram),
      icon: Instagram,
    },
    brand.website && {
      label: "Website",
      href: websiteUrl(brand.website),
      text: websiteLabel(brand.website),
      icon: Globe,
    },
    brand.contact_email && {
      label: "Email",
      href: `mailto:${brand.contact_email}`,
      text: brand.contact_email,
      icon: Mail,
    },
  ].filter(Boolean) as {
    label: string;
    href: string;
    text: string;
    icon: typeof Globe;
  }[];

  if (story.length === 0 && details.length === 0 && links.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2 className="font-canela text-2xl text-oma-black sm:text-3xl">
            About {brand.name}
          </h2>
          <div className="mt-4 space-y-4">
            {story.length > 0 ? (
              story.map((paragraph, index) => (
                <p
                  key={index}
                  className="max-w-2xl text-base leading-relaxed text-oma-cocoa/90"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-base text-oma-cocoa/80">
                This designer hasn&apos;t added their story yet.
              </p>
            )}
          </div>
        </div>

        <div className="lg:pt-2">
          {details.length > 0 && (
            <dl className="divide-y divide-oma-gold/15 border-y border-oma-gold/15">
              {details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-oma-cocoa/70">
                    {detail.label}
                  </dt>
                  <dd className="min-w-0 break-words text-right font-canela text-lg text-oma-black">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {links.length > 0 && (
            <ul className="mt-6 space-y-2">
              {links.map(({ label, href, text, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] max-w-full items-center gap-2.5 text-sm text-oma-cocoa/90 underline-offset-4 transition-colors hover:text-oma-plum hover:underline"
                  >
                    <Icon className="size-4 shrink-0 text-oma-cocoa/60" aria-hidden />
                    <span className="truncate">{text}</span>
                    <span className="sr-only">({label})</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
