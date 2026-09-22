/** Window event the search dialog listens for. */
export const OPEN_SEARCH_EVENT = "omahub:open-search";

/** Open the site search dialog from anywhere (header button, menu, ...). */
export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
