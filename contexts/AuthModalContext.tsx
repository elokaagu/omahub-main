"use client";

import React, { createContext, useContext } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import { AuthRequiredModal } from "@/components/ui/auth-required-modal";

interface AuthModalContextType {
  openAuthModal: (config?: {
    title?: string;
    message?: string;
    showSignUp?: boolean;
    redirectTo?: string;
  }) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, config, openAuthModal, closeAuthModal } = useAuthModal();

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthRequiredModal
        isOpen={isOpen}
        onClose={closeAuthModal}
        title={config.title}
        message={config.message}
        showSignUp={config.showSignUp}
        redirectTo={config.redirectTo}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModalContext() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error(
      "useAuthModalContext must be used within an AuthModalProvider"
    );
  }
  return context;
}
