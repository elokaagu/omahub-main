"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/services/authService";
import { useAuth } from "@/contexts/AuthContext";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  showSignUp?: boolean;
  redirectTo?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = "Authentication Required",
  message = "Please sign in to continue with this action.",
  showSignUp = true,
  redirectTo,
}: AuthRequiredModalProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUserProfile } = useAuth();

  const handleClose = () => {
    setIsLoading(false);
    setError(null);
    setEmail("");
    setPassword("");
    setName("");
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      toast.success("Sign in successful!");
      await refreshUserProfile();
      handleClose();
    } catch (error: any) {
      setError(error.message || "Sign in failed. Please try again.");
      toast.error("Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signUp(email, password);
      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );
      handleClose();
    } catch (error: any) {
      setError(error.message || "Account creation failed. Please try again.");
      toast.error("Account creation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-oma-plum">
            {title}
          </DialogTitle>
          <DialogDescription className="text-oma-cocoa">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isSignIn ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-oma-cocoa/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-oma-cocoa/50" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white py-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-oma-plum hover:text-oma-plum/80 underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="signup-name"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Full Name
                </Label>
                <Input
                  id="signup-name"
                  placeholder="Enter your full name"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signup-email"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Email Address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signup-password"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white py-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          )}

          {showSignUp && (
            <>
              <Separator className="my-6" />
              <div className="text-center">
                <p className="text-sm text-oma-cocoa mb-3">
                  {isSignIn
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsSignIn(!isSignIn)}
                  className="w-full border-oma-beige text-oma-cocoa hover:bg-oma-beige/10"
                >
                  {isSignIn ? "Create New Account" : "Sign In Instead"}
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-oma-cocoa hover:text-oma-cocoa/80"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
