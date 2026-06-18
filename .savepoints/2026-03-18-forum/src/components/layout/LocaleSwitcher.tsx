"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/constants";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className="flex items-center rounded border border-white/[0.08] bg-[#141414] p-0.5"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={cn(
            "rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
            locale === l
              ? "bg-[#c41e1e]/20 text-[#e52525]"
              : "text-[#6b6b6b] hover:text-[#f0f0f0]",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
