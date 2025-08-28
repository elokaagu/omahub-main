import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";

/**
 * Helper functions for safer Supabase queries that avoid 406 Not Acceptable errors
 */

export const supabaseHelpers = {
  /**
   * Safely get a single profile by ID, avoiding 406 errors
   */
  async getProfileById(userId: string) {
    const supabase = createClientComponentClient<Database>();

    try {
      // Use maybeSingle() instead of single() to avoid 406 errors
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      return { data: null, error };
    }
  },

  /**
   * Safely get profiles with array response, then extract single if needed
   */
  async getProfileByIdSafe(userId: string) {
    const supabase = createClientComponentClient<Database>();

    try {
      // Use array query first, then extract single result
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .limit(1);

      if (error) {
        console.error("Error fetching profile (safe):", error);
        return { data: null, error };
      }

      // Return single item or null
      const profile = data && data.length > 0 ? data[0] : null;
      return { data: profile, error: null };
    } catch (error) {
      console.error("Unexpected error fetching profile (safe):", error);
      return { data: null, error };
    }
  },

  /**
   * Safely fetch data with proper error handling and fallbacks
   */
  async safeFetch<T>(
    tableName: string,
    options: {
      select?: string;
      filters?: Array<{ column: string; operator: string; value: any }>;
      single?: boolean;
      limit?: number;
    } = {}
  ): Promise<{ data: T | T[] | null; error: any | null }> {
    const supabase = createClientComponentClient<Database>();

    try {
      let query = supabase.from(tableName).select(options.select || "*");

      // Apply filters
      if (options.filters) {
        options.filters.forEach((filter: any) => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Execute query based on expected result type
      let result;
      if (options.single) {
        // Use maybeSingle() to avoid 406 errors
        result = await query.maybeSingle();
      } else {
        result = await query;
      }

      if (result.error) {
        console.error(`Error fetching from ${tableName}:`, result.error);
        return { data: null, error: result.error };
      }

      return { data: result.data as T | T[], error: null };
    } catch (error) {
      console.error(`Unexpected error fetching from ${tableName}:`, error);
      return { data: null, error };
    }
  },

  /**
   * Create or update profile with proper error handling
   */
  async upsertProfile(profileData: any) {
    const supabase = createClientComponentClient<Database>();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: "id",
          ignoreDuplicates: false,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error upserting profile:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error upserting profile:", error);
      return { data: null, error };
    }
  },

  /**
   * Safely make API calls with proper headers and error handling
   */
  async safeApiCall(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: "include", // Always include credentials
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Use standard JSON accept header
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call failed (${response.status}):`, errorText);

        // Handle specific error codes
        if (response.status === 406) {
          throw new Error(
            `406 Not Acceptable: The server cannot produce a response matching the request. URL: ${url}`
          );
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Safe API call error:", error);
      return { data: null, error };
    }
  },
};

export default supabaseHelpers;
