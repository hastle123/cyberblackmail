"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { RU_LOCALE_ENABLED, routing } from "@/i18n/routing";
import { cn } from "@/lib/constants";

export function LocaleSwitcher() {
  // Hooks must run before any early return
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  if (!RU_LOCALE_ENABLED || routing.locales.length < 2) return null;

  return (
    <div
      className="flex h-9 items-center rounded-lg border border-line bg-surface/80 p-1"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          aria-pressed={locale === l}
          className={cn(
            "h-full rounded-md px-2 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
            locale === l ? "bg-white/[0.09] text-fg" : "text-fg-4 hover:text-fg-2",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
