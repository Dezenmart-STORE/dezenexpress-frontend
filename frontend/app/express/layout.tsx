import ExpressLayout from "@/components/express/ExpressLayout";
import { ReactNode } from "react";
export default function Layout({ children }: { children: ReactNode }) {
  return <ExpressLayout>{children}</ExpressLayout>;
}
