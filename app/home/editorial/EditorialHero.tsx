import type { Edition } from "@/lib/data/editions";
import { EditorialHeroContent } from "./EditorialHeroContent";

type EditorialHeroProps = {
  upcomingEdition: Edition | null;
  latestPastEdition: Edition | null;
};

/**
 * Between-editions hero: editorial split layout with copy on the left
 * (~46%) and a tall film card on the right (~54%). On mobile the film
 * card stacks beneath the headline. The only CTA is email capture.
 */
export function EditorialHero({
  upcomingEdition,
  latestPastEdition,
}: EditorialHeroProps) {
  return (
    <EditorialHeroContent
      upcomingEdition={upcomingEdition}
      latestPastEdition={latestPastEdition}
    />
  );
}
