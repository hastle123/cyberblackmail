import type { ReactNode } from "react";
import "./globals.css";

// Root layout passes children through; html/body live in [locale]/layout.tsx
// per next-intl App Router convention (keeps CSS bound to locale routes).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
