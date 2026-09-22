// Plain shared module (no client directive) so server components can call
// these too. A function exported from a client-component file is only a
// reference on the server, and calling it there throws at render time.

export const BLUR_IN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Stagger delay for the nth item in a list, capped so long lists don't lag. */
export function blurStagger(index: number, cap = 10, each = 0.05) {
  return Math.min(index, cap) * each;
}
