export function formatLegalEffectiveDate(isoOrDateString: string): string {
  const d = new Date(isoOrDateString);
  if (Number.isNaN(d.getTime())) {
    return isoOrDateString;
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
