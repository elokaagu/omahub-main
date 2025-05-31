"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthDebug() {
  const { user, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      setSessionInfo({ session: session?.user, error });
    };

    checkSession();
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? "true" : "false"}</div>
        <div>User ID: {user?.id || "null"}</div>
        <div>User Email: {user?.email || "null"}</div>
        <div>User Role: {user?.role || "null"}</div>
        <div>First Name: {user?.first_name || "null"}</div>
        <div>Avatar URL: {user?.avatar_url || "null"}</div>
        <div>Session User: {sessionInfo?.session?.id || "null"}</div>
        <div>Session Error: {sessionInfo?.error?.message || "null"}</div>
      </div>
    </div>
  );
}
