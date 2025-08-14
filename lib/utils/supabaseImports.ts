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
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase server helpers
export const getSupabaseServer = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase middleware helpers
export const getSupabaseMiddleware = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase action helpers
export const getSupabaseAction = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase realtime
export const getSupabaseRealtime = async () => {
  const { RealtimeClient } = await import("@supabase/supabase-js");
  return RealtimeClient;
};

// Dynamic import for Supabase storage
export const getSupabaseStorage = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase functions
export const getSupabaseFunctions = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
};

// Dynamic import for Supabase edge functions
export const getSupabaseEdgeFunctions = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient;
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

// Note: Dynamic imports removed due to type compatibility issues
// Use direct imports instead for better type safety

// Note: Dynamic imports removed due to type compatibility issues
// Use direct imports instead for better type safety

// Note: All dynamic imports removed due to type compatibility issues
// Use direct imports instead for better type safety

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
};
