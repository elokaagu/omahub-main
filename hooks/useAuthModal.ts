"use client";

import { useState, useCallback } from "react";

interface AuthModalConfig {
  title?: string;
  message?: string;
  showSignUp?: boolean;
  redirectTo?: string;
}

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AuthModalConfig>({});

  const openAuthModal = useCallback((config: AuthModalConfig = {}) => {
    setConfig(config);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    setConfig({});
  }, []);

  return {
    isOpen,
    config,
    openAuthModal,
    closeAuthModal,
  };
}
