"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Redirect old /past bookmarks to the unified schedule page. */
export default function PastTalksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
