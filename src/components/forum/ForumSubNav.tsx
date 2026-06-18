"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MastheadLock } from "@/components/layout/Wordmark";
import { cn } from "@/lib/constants";

const LINKS = [
  { href: "/forum", key: "home", exact: true },
  { href: "/forum/new", key: "newTopic", exact: false },
] as const;

export function ForumSubNav() {
  const t = useTranslations("forumNav");
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.07] bg-[#0d0d0d]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="h-4 w-[3px] rounded-full bg-[#c41e1e]" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c41e1e]">
              {t("branch")}
            </p>
            <p className="flex items-center gap-1.5 leading-none">
              <Image
                src="/brand/masthead-text.png"
                alt="CyberBlackmail"
                width={748}
                height={120}
                className="masthead-logo h-[15px] w-auto opacity-90"
              />
              <MastheadLock className="masthead-lock h-[10px] w-auto text-[#ebebeb]" />
              <span className="text-[11px] font-medium text-[#737373]">{t("forum")}</span>
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, key, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? "bg-[#c41e1e]/15 text-[#e52525]"
                    : "text-[#888] hover:bg-white/[0.04] hover:text-[#f0f0f0]",
                )}
              >
                {t(key)}
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-1 rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#666] transition-colors hover:text-[#a3a3a3]"
          >
            {t("backToNews")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
