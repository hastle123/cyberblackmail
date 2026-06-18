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
  { href: "/forum", key: "forum" },
  { href: "/breaches", key: "breaches" },
  { href: "/ransomware", key: "ransomware" },
  { href: "/vulnerabilities", key: "vulnerabilities" },
  { href: "/actors", key: "actors" },
  { href: "/alerts", key: "alerts" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { open, openSearch, closeSearch } = useGlobalSearch();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
          "sticky top-0 z-50 border-b transition-[background,box-shadow,border-color] duration-200",
          scrolled
            ? "border-white/[0.08] bg-[#090909]/97 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
            : "border-white/[0.05] bg-[#090909]",
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-6 px-4 lg:h-[4.75rem] lg:px-8">
          <Wordmark className="shrink-0" />

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV_KEYS.map(({ href, key }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
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

          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcher />

            <button
              type="button"
              onClick={openSearch}
              className="hidden h-9 min-w-[9rem] items-center justify-between gap-3 rounded-sm border border-white/[0.08] bg-[#121212] px-3 text-left text-xs text-[#737373] transition-colors hover:border-white/[0.12] hover:text-[#a3a3a3] md:flex"
              aria-label={t("search")}
            >
              <span className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t("search")}
              </span>
              <kbd className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-[#525252]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={openSearch}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/[0.08] text-[#8a8a8a] md:hidden"
              aria-label={t("search")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/[0.08] text-[#8a8a8a] lg:hidden"
              aria-label="Menu"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-white/[0.06] lg:hidden">
            <div className="grid grid-cols-2 gap-1 p-3">
              {NAV_KEYS.map(({ href, key }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-sm px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-[#a3a3a3] hover:bg-white/[0.03] hover:text-[#fafafa]"
                >
                  {t(key)}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <GlobalSearch open={open} onClose={closeSearch} />
    </>
  );
}
