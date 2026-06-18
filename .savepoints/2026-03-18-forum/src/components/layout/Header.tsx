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
  const { open, openSearch, closeSearch } = useGlobalSearch();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 lg:px-6">
          <Wordmark className="shrink-0" />

          <nav className="hidden flex-1 items-center gap-0.5 md:flex">
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
              className="flex h-8 w-8 items-center justify-center rounded border border-white/[0.08] text-[#888] transition-colors hover:border-[#c41e1e]/30 hover:text-[#f0f0f0] md:w-auto md:gap-2 md:px-3"
              aria-label={t("search")}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden text-xs md:inline">{t("search")}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded border border-white/[0.08] text-[#888] md:hidden"
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
          <nav className="border-t border-white/[0.07] md:hidden">
            <div className="grid grid-cols-2 gap-1 p-3">
              {NAV_KEYS.map(({ href, key }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] hover:bg-white/[0.04] hover:text-[#f0f0f0]"
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
