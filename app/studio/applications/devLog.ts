/** Verbose studio applications logging — development only. */
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.warn(...args);
  }
}
