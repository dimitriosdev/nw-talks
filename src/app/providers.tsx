"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { Navbar } from "@/components/Navbar";
import { ToastContainer } from "@/components/ui/Toast";
import { BackToTop } from "@/components/ui/BackToTop";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <BackToTop />
        <ToastContainer />
      </PreferencesProvider>
    </AuthProvider>
  );
}
