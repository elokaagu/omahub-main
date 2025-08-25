import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Get all cookies
    const allCookies = Array.from(cookieStore.getAll()).map(cookie => ({
      name: cookie.name,
      value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : ''),
      length: cookie.value.length
    }));
    
    // Try to create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              return cookie?.value;
            } catch (error) {
              console.error(`Error getting cookie ${name}:`, error);
              return undefined;
            }
          },
          set() {},
          remove() {},
        },
      }
    );
    
    // Try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Try to get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      cookies: allCookies,
      session: sessionData?.session ? {
        user_id: sessionData.session.user.id,
        email: sessionData.session.user.email,
        expires_at: sessionData.session.expires_at
      } : null,
      sessionError: sessionError?.message || null,
      user: userData?.user ? {
        id: userData.user.id,
        email: userData.user.email
      } : null,
      userError: userError?.message || null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      cookies: [],
      session: null,
      user: null
    });
  }
}
