import { Suspense } from "react";
import { IntelShell } from "@/components/layout/IntelShell";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <IntelShell maxWidth="wide">
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </IntelShell>
  );
}
