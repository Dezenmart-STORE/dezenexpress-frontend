import { ReactNode } from "react";
import CustomerGuard from "@/components/express/customer/CustomerGuard";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <CustomerGuard>{children}</CustomerGuard>;
}
