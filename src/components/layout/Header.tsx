"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/constants";
import { editorial } from "@/lib/editorial";
import { GlobalSearch, useGlobalSearch } from "@/components/search/GlobalSearch";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Wordmark } from "@/components/layout/Wordmark";

const NAV_KEYS = [
  { href: "/intel", key: "latest" },
  { href: "/scams", key: "scams" },
  { href: "/breaches", key: "breaches" },
  { href: "/ransomware", key: "ransomware" },
  { href: "/vulnerabilities", key: "vulnerabilities" },
  { href: "/actors", key: "actors" },
  { href: "/alerts", key: "alerts" },
  { href: "/forum", key: "forum" },
] as const;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const { open, openSearch, closeSearch } = useGlobalSearch();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut("⌘K");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || mobileOpen
            ? "border-line bg-canvas/85 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)]"
            : "border-transparent bg-canvas/40",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-8">
          <Wordmark className="shrink-0" />

          <nav className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
            {NAV_KEYS.map(({ href, key }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    editorial.navLink,
                    active ? editorial.navLinkActive : editorial.navLinkIdle,
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 xl:ml-0">
            <button
              type="button"
              onClick={openSearch}
              className="hidden h-9 w-48 items-center gap-2.5 rounded-lg border border-line bg-surface/80 px-3 text-left text-[13px] text-fg-4 transition-colors hover:border-line-strong hover:text-fg-3 md:flex"
              aria-label={t("search")}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="flex-1">{t("search")}</span>
              <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-4">
                {shortcut}
              </kbd>
            </button>

            <button
              type="button"
              onClick={openSearch}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg-3 transition-colors hover:text-fg md:hidden"
              aria-label={t("search")}
            >
              <SearchIcon className="h-4 w-4" />
            </button>

            <LocaleSwitcher />

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg-3 transition-colors hover:text-fg xl:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-line xl:hidden">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-3 sm:grid-cols-4 lg:px-8">
              {NAV_KEYS.map(({ href, key }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/[0.07] text-fg"
                        : "text-fg-2 hover:bg-white/[0.04] hover:text-fg",
                    )}
                  >
                    {t(key)}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <GlobalSearch open={open} onClose={closeSearch} />
    </>
  );
}
