/**
 * Phase 2B: Dynamic Supabase Import System
 * This replaces the large @supabase/supabase-js bundle with dynamic imports
 * to reduce bundle size significantly
 */

import dynamic from "next/dynamic";

// Dynamic import for Supabase client creation
export const createSupabaseClient = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase client with database types
export const createTypedSupabaseClient = async <T = any>() => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient<T>;
};

// Dynamic import for Supabase auth helpers
export const getSupabaseAuth = async () => {
  const { createClientComponentClient } = await import("@supabase/supabase-js");
  return createClientComponentClient;
};

// Dynamic import for Supabase server helpers
export const getSupabaseServer = async () => {
  const { createServerComponentClient } = await import("@supabase/supabase-js");
  return createServerComponentClient;
};

// Dynamic import for Supabase middleware helpers
export const getSupabaseMiddleware = async () => {
  const { createMiddlewareClient } = await import("@supabase/supabase-js");
  return createMiddlewareClient;
};

// Dynamic import for Supabase action helpers
export const getSupabaseAction = async () => {
  const { createServerActionClient } = await import("@supabase/supabase-js");
  return createServerActionClient;
};

// Dynamic import for Supabase realtime
export const getSupabaseRealtime = async () => {
  const { RealtimeClient } = await import("@supabase/supabase-js");
  return RealtimeClient;
};

// Dynamic import for Supabase storage
export const getSupabaseStorage = async () => {
  const { StorageClient } = await import("@supabase/supabase-js");
  return StorageClient;
};

// Dynamic import for Supabase functions
export const getSupabaseFunctions = async () => {
  const { FunctionsClient } = await import("@supabase/supabase-js");
  return FunctionsClient;
};

// Dynamic import for Supabase edge functions
export const getSupabaseEdgeFunctions = async () => {
  const { EdgeFunctionsClient } = await import("@supabase/supabase-js");
  return EdgeFunctionsClient;
};

// Dynamic import for Supabase auth UI
export const getSupabaseAuthUI = async () => {
  const { Auth } = await import("@supabase/auth-ui-react");
  return Auth;
};

// Dynamic import for Supabase auth UI themes
export const getSupabaseAuthUIThemes = async () => {
  const { ThemeSupa } = await import("@supabase/auth-ui-shared");
  return ThemeSupa;
};

// Dynamic import for Supabase auth UI components
export const getSupabaseAuthUIComponents = async () => {
  const { Auth } = await import("@supabase/auth-ui-react");
  const { ThemeSupa } = await import("@supabase/auth-ui-shared");
  return { Auth, ThemeSupa };
};

// Lazy Supabase client wrapper
export const LazySupabaseClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.createClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase auth client wrapper
export const LazySupabaseAuthClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.createClientComponentClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase server client wrapper
export const LazySupabaseServerClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.createServerComponentClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase middleware client wrapper
export const LazySupabaseMiddlewareClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.createMiddlewareClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase action client wrapper
export const LazySupabaseActionClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.createServerActionClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase realtime client wrapper
export const LazySupabaseRealtimeClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.RealtimeClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase storage client wrapper
export const LazySupabaseStorageClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.StorageClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase functions client wrapper
export const LazySupabaseFunctionsClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.FunctionsClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase edge functions client wrapper
export const LazySupabaseEdgeFunctionsClient = dynamic(
  () => import("@supabase/supabase-js").then((mod) => ({ default: mod.EdgeFunctionsClient })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase auth UI wrapper
export const LazySupabaseAuthUI = dynamic(
  () => import("@supabase/auth-ui-react").then((mod) => ({ default: mod.Auth })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy Supabase auth UI themes wrapper
export const LazySupabaseAuthUIThemes = dynamic(
  () => import("@supabase/auth-ui-shared").then((mod) => ({ default: mod.ThemeSupa })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Export all utilities and components
export const SupabaseImports = {
  createSupabaseClient,
  createTypedSupabaseClient,
  getSupabaseAuth,
  getSupabaseServer,
  getSupabaseMiddleware,
  getSupabaseAction,
  getSupabaseRealtime,
  getSupabaseStorage,
  getSupabaseFunctions,
  getSupabaseEdgeFunctions,
  getSupabaseAuthUI,
  getSupabaseAuthUIThemes,
  getSupabaseAuthUIComponents,
  LazySupabaseClient,
  LazySupabaseAuthClient,
  LazySupabaseServerClient,
  LazySupabaseMiddlewareClient,
  LazySupabaseActionClient,
  LazySupabaseRealtimeClient,
  LazySupabaseStorageClient,
  LazySupabaseFunctionsClient,
  LazySupabaseEdgeFunctionsClient,
  LazySupabaseAuthUI,
  LazySupabaseAuthUIThemes,
};
