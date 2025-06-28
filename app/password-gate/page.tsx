"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGatePage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user already has access
  useEffect(() => {
    const hasAccess = localStorage.getItem("omahub-access");
    if (hasAccess === "granted") {
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store access in localStorage as well for client-side checks
        localStorage.setItem("omahub-access", "granted");

        toast.success("Access granted! Welcome to OmaHub.");

        // Redirect to the intended page or home
        const redirectTo = searchParams.get("redirect") || "/";
        router.push(redirectTo);
      } else {
        toast.error(data.error || "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (error) {
      console.error("Password verification error:", error);
      toast.error("Something went wrong. Please try again.");
      setPassword("");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-oma-plum/10 p-4 rounded-full">
            <Lock className="h-8 w-8 text-oma-plum" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-bold tracking-tight text-oma-cocoa mb-2">
          Access Required
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          This platform is currently in beta. Please enter the access password
          to continue.
        </p>

        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-oma-beige/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-oma-cocoa"
              >
                Access Password
              </Label>
              <div className="mt-2 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-oma-plum focus:outline-none focus:ring-oma-plum sm:text-sm"
                  placeholder="Enter access password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-oma-plum hover:bg-oma-plum/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-oma-plum disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  "Access Platform"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              For access, please contact the OmaHub team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
