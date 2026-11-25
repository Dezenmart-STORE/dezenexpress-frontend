"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import CustomerSignIn from "./CustomerSignIn";
import {
  getCustomerToken,
  AUTH_EXPIRED_EVENT,
} from "@/lib/express/customerAuth";

// The customer home page is public; everything else needs a signed-in customer.
const PUBLIC_PATHS = ["/express/customer"];

export default function CustomerGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    setState(getCustomerToken() ? "in" : "out");
    const onExpired = () => setState("out");
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [pathname]);

  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;

  if (state === "checking") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "out") return <CustomerSignIn />;

  return <>{children}</>;
}
