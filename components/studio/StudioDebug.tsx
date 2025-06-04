"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import { getUserPermissions } from "@/lib/services/permissionsService";

export default function StudioDebug() {
  const { user, session } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function gatherDebugInfo() {
      if (!user) {
        setDebugInfo({ error: "No user in context" });
        setLoading(false);
        return;
      }

      try {
        // Get permissions
        const permissions = await getUserPermissions(user.id, user.email);

        // Get profile directly
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Get brands if user has owned brands
        let brands = null;
        if (profile?.owned_brands?.length > 0) {
          const { data: brandsData, error: brandsError } = await supabase
            .from("brands")
            .select("*")
            .in("id", profile.owned_brands);

          brands = { data: brandsData, error: brandsError };
        }

        setDebugInfo({
          userContext: {
            id: user.id,
            email: user.email,
            role: user.role,
            owned_brands: user.owned_brands,
          },
          session: {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
          },
          permissions,
          profile: {
            data: profile,
            error: profileError,
          },
          brands,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    }

    gatherDebugInfo();
  }, [user, session, supabase]);

  if (loading) {
    return <div className="text-xs text-gray-500">Loading debug info...</div>;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
      <h3 className="font-bold text-yellow-800 mb-2">🐛 Studio Debug Info</h3>
      <pre className="text-yellow-700 whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <div className="mt-2 text-yellow-600">
        <p>
          <strong>Quick Checks:</strong>
        </p>
        <p>• User in context: {user ? "✅" : "❌"}</p>
        <p>• Has session: {session ? "✅" : "❌"}</p>
        <p>• Profile loaded: {debugInfo?.profile?.data ? "✅" : "❌"}</p>
        <p>
          • Has permissions: {debugInfo?.permissions?.length > 0 ? "✅" : "❌"}
        </p>
        <p>
          • Has owned brands:{" "}
          {debugInfo?.profile?.data?.owned_brands?.length > 0 ? "✅" : "❌"}
        </p>
        <p>
          • Brands fetched: {debugInfo?.brands?.data?.length > 0 ? "✅" : "❌"}
        </p>
      </div>
    </div>
  );
}
