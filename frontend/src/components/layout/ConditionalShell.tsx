"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/app");

  return (
    <>
      {!isApp && <Navbar />}
      <main id="main-content">{children}</main>
      {!isApp && <Footer />}
    </>
  );
}
