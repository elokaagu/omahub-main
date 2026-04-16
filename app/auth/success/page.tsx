import { Suspense } from "react";
import AuthSuccessClient, { AuthSuccessLoading } from "./AuthSuccessClient";

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<AuthSuccessLoading />}>
      <AuthSuccessClient />
    </Suspense>
  );
}
