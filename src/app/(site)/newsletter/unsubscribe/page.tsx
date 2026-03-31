import { Suspense } from "react";
import { UnsubscribeClient } from "@/components/newsletter/unsubscribe-client";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeClient />
    </Suspense>
  );
}
