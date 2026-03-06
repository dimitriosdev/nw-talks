"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { signOut } from "@/lib/auth";

type AdminTabKey = "overview" | "schedule" | "speakers" | "talks" | "settings";

const adminTabs: {
  href: string;
  key: AdminTabKey;
  icon: ReactNode;
}[] = [
  {
    href: "/admin",
    key: "overview",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 12l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/schedule",
    key: "schedule",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path
          d="M16 3v4M8 3v4M3 11h18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/admin/speakers",
    key: "speakers",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/talks",
    key: "talks",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    key: "settings",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
        <path
          d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.2 1.2a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.2 1.2 0 0 1-1.2 1.2h-1.6A1.2 1.2 0 0 1 11 20v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1.2-1.2a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.2 1.2 0 0 1-1.2-1.2v-1.6A1.2 1.2 0 0 1 4 10h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1.2-1.2a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4A1.2 1.2 0 0 1 11 2.8h1.6A1.2 1.2 0 0 1 13.8 4v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1.2 1.2a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, theme, setTheme, texts } = usePreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onAdminRoute = pathname.startsWith("/admin");

  const publicLinks = [
    { href: "/", label: texts.nav.schedule },
    { href: "/talks", label: texts.nav.talks },
  ];

  const adminLabelByKey: Record<AdminTabKey, string> = {
    overview: texts.nav.overview,
    schedule: texts.nav.schedule,
    speakers: texts.nav.speakers,
    talks: texts.nav.talks,
    settings: texts.nav.settings,
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isAdminTabActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
      isActive(href)
        ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    }`;

  const allLinks = [
    ...publicLinks,
    ...(isAdmin ? [{ href: "/admin", label: texts.nav.admin }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 dark:text-white"
        >
          NW-Talks
        </Link>

        {isAdmin && onAdminRoute && (
          <nav
            className="mx-3 flex max-w-[200px] flex-1 justify-center overflow-x-auto rounded-full border border-gray-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 md:hidden"
            aria-label={texts.nav.adminTabs}
          >
            {adminTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                  isAdminTabActive(tab.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
                aria-label={adminLabelByKey[tab.key]}
                title={adminLabelByKey[tab.key]}
              >
                {tab.icon}
                <span className="sr-only">{adminLabelByKey[tab.key]}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Desktop links */}
        <div className="hidden items-center gap-1 text-sm md:flex">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <span className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />
              <Link href="/admin" className={linkClass("/admin")}>
                {texts.nav.admin}
              </Link>
            </>
          )}

          <div className="ml-2 flex items-center gap-1">
            <div
              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900"
              role="group"
              aria-label={texts.nav.language}
              title={texts.nav.language}
            >
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`inline-flex h-7 min-w-10 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition ${
                  language === "en"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                aria-pressed={language === "en"}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("el")}
                className={`inline-flex h-7 min-w-10 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition ${
                  language === "el"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                aria-pressed={language === "el"}
              >
                ΕΛ
              </button>
            </div>

            <div
              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900"
              role="group"
              aria-label={texts.nav.theme}
              title={texts.nav.theme}
            >
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`inline-flex h-7 w-8 items-center justify-center rounded transition ${
                  theme === "light"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                aria-pressed={theme === "light"}
                aria-label={texts.nav.light}
                title={texts.nav.light}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93m14.14 0-1.41 1.41M6.34 17.66l-1.41 1.41"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`inline-flex h-7 w-8 items-center justify-center rounded transition ${
                  theme === "dark"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                aria-pressed={theme === "dark"}
                aria-label={texts.nav.dark}
                title={texts.nav.dark}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {user ? (
            <button
              onClick={() => signOut()}
              className="ml-2 rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {texts.nav.signOut}
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            >
              {texts.nav.signIn}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
          aria-label={texts.nav.toggleMenu}
        >
          {mobileOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 dark:border-gray-700 dark:bg-gray-900 md:hidden">
          <div className="flex flex-col gap-1 text-sm">
            {allLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={linkClass(l.href)}
              >
                {l.label}
              </Link>
            ))}

            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="mt-1 rounded-md px-3 py-1.5 text-left text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {texts.nav.signOut}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md bg-blue-600 px-3 py-1.5 text-center text-white hover:bg-blue-700"
              >
                {texts.nav.signIn}
              </Link>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div
                className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900"
                role="group"
                aria-label={texts.nav.language}
                title={texts.nav.language}
              >
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`inline-flex h-8 min-w-10 flex-1 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition ${
                    language === "en"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                  aria-pressed={language === "en"}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("el")}
                  className={`inline-flex h-8 min-w-10 flex-1 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition ${
                    language === "el"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                  aria-pressed={language === "el"}
                >
                  ΕΛ
                </button>
              </div>
              <div
                className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900"
                role="group"
                aria-label={texts.nav.theme}
                title={texts.nav.theme}
              >
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`inline-flex h-8 flex-1 items-center justify-center rounded transition ${
                    theme === "light"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                  aria-pressed={theme === "light"}
                  aria-label={texts.nav.light}
                  title={texts.nav.light}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path
                      d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93m14.14 0-1.41 1.41M6.34 17.66l-1.41 1.41"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`inline-flex h-8 flex-1 items-center justify-center rounded transition ${
                    theme === "dark"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                  aria-pressed={theme === "dark"}
                  aria-label={texts.nav.dark}
                  title={texts.nav.dark}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
