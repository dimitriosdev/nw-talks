"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";

const adminTabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/speakers", label: "Speakers" },
  { href: "/admin/talks", label: "Talks" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [user, isAdmin, loading, router]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect
  }

  return (
    <div>
      {/* Admin sub-navigation tabs */}
      <div className="mb-6">
        <nav
          className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
          aria-label="Admin tabs"
        >
          {adminTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive(tab.href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
