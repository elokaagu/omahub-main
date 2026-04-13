import { createClient } from "@supabase/supabase-js";

export type CheckStatus = "ok" | "error" | "skipped";

export type OverallHealthStatus = "healthy" | "degraded" | "unhealthy";

export type SystemHealthChecks = {
  environment: CheckStatus;
  database: CheckStatus;
  email: CheckStatus;
};

const DB_PROBE_TIMEOUT_MS = 3500;

function hasEnv(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function probeDatabase(): Promise<CheckStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    return "skipped";
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await withTimeout(
      (async () =>
        supabase.from("brands").select("id").limit(1))(),
      DB_PROBE_TIMEOUT_MS
    );
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

/**
 * Resolve app version for health payloads (no secrets).
 * Prefer APP_VERSION; Vercel exposes git/deployment metadata when enabled.
 */
export function getHealthAppVersion(): string {
  return (
    process.env.APP_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim().slice(0, 12) ||
    process.env.npm_package_version?.trim() ||
    "0.1.0"
  );
}

export async function computeSystemHealth(): Promise<{
  status: OverallHealthStatus;
  checks: SystemHealthChecks;
  httpStatus: number;
}> {
  const publicUrlOk = hasEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publicAnonOk = hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const environment: CheckStatus =
    publicUrlOk && publicAnonOk ? "ok" : "error";

  const database: CheckStatus =
    environment === "ok" ? await probeDatabase() : "skipped";

  /** Optional for core readiness; omitted in many dev environments. */
  const email: CheckStatus = hasEnv("RESEND_API_KEY") ? "ok" : "skipped";

  const checks: SystemHealthChecks = {
    environment,
    database,
    email,
  };

  if (environment === "error") {
    return { status: "unhealthy", checks, httpStatus: 503 };
  }

  if (database === "error") {
    return { status: "unhealthy", checks, httpStatus: 503 };
  }

  if (database === "skipped") {
    return { status: "degraded", checks, httpStatus: 200 };
  }

  return { status: "healthy", checks, httpStatus: 200 };
}
