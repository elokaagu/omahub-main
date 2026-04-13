/**
 * Gate for `/api/debug/*` style handlers.
 * Development: allowed. Production: only when the named env var is `"true"`.
 */
export function isDebugApiAllowed(envFlagName: string): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return process.env[envFlagName] === "true";
}
