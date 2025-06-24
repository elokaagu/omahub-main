"use client";

import { useEffect, useState } from "react";
import DirectoryClient from "./DirectoryClient";
import ErrorBoundary from "../components/ErrorBoundary";

export default function ClientWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <ErrorBoundary>
      <DirectoryClient />
    </ErrorBoundary>
  );
}
