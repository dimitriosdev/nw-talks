"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (user) {
    // Already logged in — redirect
    isAdmin(user.email).then((admin) => {
      router.replace(admin ? "/admin" : "/");
    });
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      const admin = await isAdmin(u.email);
      router.replace(admin ? "/admin" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <h1 className="text-2xl font-bold">Admin Sign In</h1>
      <p className="max-w-sm text-center text-gray-500">
        Sign in with your Google account to manage schedules, speakers, and talks.
      </p>
      <Button onClick={handleSignIn} disabled={signingIn}>
        {signingIn ? (
          <>
            <Spinner className="mr-2" /> Signing in…
          </>
        ) : (
          "Sign in with Google"
        )}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
