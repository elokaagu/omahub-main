"use client";

import { useEffect, useState } from "react";
import DirectoryClient from "./DirectoryClient";

export default function ClientWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <DirectoryClient />;
}
