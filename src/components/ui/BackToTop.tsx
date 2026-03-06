"use client";

import { useEffect, useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { texts } = usePreferences();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700"
      aria-label={texts.common.backToTop}
      title={texts.common.backToTop}
    >
      ↑
    </button>
  );
}
