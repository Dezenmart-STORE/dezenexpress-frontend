import { Suspense } from "react";
import CustomerAuthCallback from "@/components/express/customer/CustomerAuthCallback";

// The backend sends customers back to <origin>/auth/google?token=…&userId=…
// (or ?error=auth_failed&message=…). useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerAuthCallback />
    </Suspense>
  );
}
