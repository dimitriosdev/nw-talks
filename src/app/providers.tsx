"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { ToastContainer } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <ToastContainer />
    </AuthProvider>
  );
}
