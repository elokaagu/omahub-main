"use client";

import { createContext, useContext } from "react";
import type { Database } from "@/lib/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface StudioInitialData {
  profile: Profile | null;
  user: {
    id: string;
    email: string | null;
    role?: Profile["role"] | null;
    owned_brands?: string[] | null;
  } | null;
}

const StudioInitialDataContext = createContext<StudioInitialData | null>(null);

export function StudioInitialDataProvider({
  value,
  children,
}: {
  value: StudioInitialData;
  children: React.ReactNode;
}) {
  return (
    <StudioInitialDataContext.Provider value={value}>
      {children}
    </StudioInitialDataContext.Provider>
  );
}

export function useStudioInitialData() {
  return useContext(StudioInitialDataContext);
}

