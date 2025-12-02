import { Suspense } from "react";
import GoogleOAuthPage from "@/components/auth/GoogleCallbackForm";

export default function GooglePage() {
  return (
    <Suspense fallback={<div>Procesando login de Google...</div>}>
      <GoogleOAuthPage />
    </Suspense>
  );
}
