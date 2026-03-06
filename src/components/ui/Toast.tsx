"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

let addToastGlobal: ((type: ToastType, text: string) => void) | null = null;

/** Imperatively show a toast from anywhere. */
export function toast(type: ToastType, text: string) {
  addToastGlobal?.(type, text);
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

let nextId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastGlobal = (type, text) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, text }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };
    return () => {
      addToastGlobal = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${typeStyles[t.type]}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
