"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import DirectoryClient from "./DirectoryClient";

export default function ClientWrapper() {
  return (
    <ErrorBoundary sectionName="directory">
      <DirectoryClient />
    </ErrorBoundary>
  );
}
