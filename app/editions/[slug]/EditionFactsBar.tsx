import { cn } from "@/lib/utils";

export type EditionFact = { label: string; value: string };

/** One column per fact on wide screens (Tailwind needs literal classes). */
const COLUMNS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

/**
 * Edition facts (city, country, venue, date, lineup) as a full-bleed bar
 * under the cover image: equal columns across the whole viewport width,
 * hairline dividers drawn by 1px gaps over a tinted background.
 */
export function EditionFactsBar({ facts }: { facts: EditionFact[] }) {
  if (facts.length === 0) return null;

  return (
    <dl
      className={cn(
        "grid w-full grid-cols-2 gap-px bg-oma-cocoa/15",
        COLUMNS[Math.min(facts.length, 5)] ?? COLUMNS[5],
      )}
    >
      {facts.map((fact, index) => (
        <div
          key={fact.label}
          className={cn(
            "bg-oma-beige px-5 py-4 sm:px-8 sm:py-6",
            // A lone last cell spans the row instead of leaving a gap.
            facts.length % 2 === 1 &&
              index === facts.length - 1 &&
              "col-span-2 md:col-span-1",
          )}
        >
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-oma-cocoa sm:text-[11px]">
            {fact.label}
          </dt>
          <dd className="mt-1 font-canela text-base text-oma-black sm:mt-1.5 sm:text-xl">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
