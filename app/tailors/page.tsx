import { Suspense } from "react";
import TailorsClient, { TailorsLoading } from "./TailorsClient";

export default function TailorsPage() {
  return (
    <Suspense fallback={<TailorsLoading />}>
      <TailorsClient />
    </Suspense>
  );
}
