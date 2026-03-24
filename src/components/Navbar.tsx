"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { signOut } from "@/lib/auth";

const navIcons: Record<string, string> = {
  "/": "/schedule.svg",
  "/talks": "/file.svg",
  "/speakers": "/globe.svg",
  "/settings": "/ico.svg",
};

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, theme, setTheme, texts } = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const publicLinks = [
    { href: "/", label: texts.nav.schedule },
    { href: "/talks", label: texts.nav.talks },
    ...(isAdmin ? [{ href: "/speakers", label: texts.nav.speakers }] : []),
    ...(isAdmin ? [{ href: "/settings", label: texts.nav.settings }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
      isActive(href)
        ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center text-lg font-bold text-gray-900 dark:text-white"
        >
          <Image
            src="/icon0.svg"
            alt="NW-Talks icon"
            width={24}
            height={24}
            className="mr-2 h-6 w-6"
          />
          NW-Talks
        </Link>

        {/* Right side: nav links (scrollable) + hamburger */}
        <div className="flex min-w-0 items-center gap-1">
          {/* Scrollable nav links */}
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {publicLinks.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                <span className="inline-flex items-center gap-1.5">
                  {l.href === "/" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block shrink-0 align-middle opacity-80"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  ) : l.href === "/talks" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block shrink-0 align-middle opacity-70"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  ) : l.href === "/speakers" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block shrink-0 align-middle opacity-70"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  ) : l.href === "/settings" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block shrink-0 align-middle opacity-70"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  ) : (
                    <Image
                      src={navIcons[l.href] ?? "/window.svg"}
                      alt=""
                      width={16}
                      height={16}
                      className="inline-block shrink-0 align-middle opacity-70"
                    />
                  )}
                  <span className="hidden sm:inline">{l.label}</span>
                </span>
              </Link>
            ))}
          </div>

          {/* Hamburger — outside the overflow container so dropdown is not clipped */}
          <div className="relative ml-1 shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={texts.nav.toggleMenu}
            >
              {menuOpen ? (
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

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-col gap-3">
                  {/* Language */}
                  <div
                    className="inline-flex h-8 w-full items-center rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-800"
                    role="group"
                    aria-label={texts.nav.language}
                  >
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`inline-flex h-7 flex-1 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition ${
                        language === "en"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                      aria-pressed={language === "en"}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("el")}
                      className={`inline-flex h-7 flex-1 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition ${
                        language === "el"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                      aria-pressed={language === "el"}
                    >
                      EL
                    </button>
                  </div>

                  {/* Theme */}
                  <div
                    className="inline-flex h-8 w-full items-center rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-800"
                    role="group"
                    aria-label={texts.nav.theme}
                  >
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`inline-flex h-7 flex-1 items-center justify-center rounded transition ${
                        theme === "light"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
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
                      className={`inline-flex h-7 flex-1 items-center justify-center rounded transition ${
                        theme === "dark"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
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

                  {/* Sign in/out */}
                  {user ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full rounded-md px-3 py-1.5 text-center text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {texts.nav.signOut}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-center text-sm text-white hover:bg-blue-700"
                    >
                      {texts.nav.signIn}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
