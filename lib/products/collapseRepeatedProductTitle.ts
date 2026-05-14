/**
 * Some legacy product titles store the same phrase concatenated many times.
 * Collapse obvious consecutive repeats and cap extreme length for display/API text.
 */
export function collapseRepeatedProductTitle(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  if (!s) return s;

  // Collapse exact adjacent repeats of the same substring (20–160 chars).
  for (let i = 0; i < 10; i++) {
    const m = /(.{20,160})(\1)+/u.exec(s);
    if (!m) break;
    s = (s.slice(0, m.index) + m[1] + s.slice(m.index + m[0].length)).trim();
  }

  if (s.length > 180) {
    const parts = s
      .split(/\s-\s/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const short = `${parts[0]} – ${parts[1]}`;
      if (short.length < s.length * 0.75) return short;
    }
    return `${s.slice(0, 177).trimEnd()}…`;
  }

  return s;
}
