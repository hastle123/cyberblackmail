"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/** Editorial wordmark — Newsreader, weight contrast */
export function Wordmark({ className = "" }: { className?: string }) {
  const t = useTranslations("brand");

  return (
    <Link href="/" className={`group flex items-stretch gap-2.5 ${className}`}>
      <span
        className="w-[3px] shrink-0 rounded-full bg-[#c41e1e] transition-colors group-hover:bg-[#e52525]"
        aria-hidden
      />
      <span className="wordmark font-serif leading-none">
        <span className="text-[1.05rem] font-normal tracking-[-0.01em] text-[#a8a8a8] transition-colors group-hover:text-[#d0d0d0] md:text-[1.15rem]">
          Cyber
        </span>
        <span className="text-[1.05rem] font-bold tracking-[-0.02em] text-[#f5f5f5] md:text-[1.15rem]">
          Blackmail
        </span>
      </span>
      <span className="sr-only">{t("name")}</span>
    </Link>
  );
}

export function WordmarkLarge() {
  return (
    <div className="inline-flex items-stretch gap-3">
      <span className="w-1 shrink-0 rounded-full bg-[#c41e1e]" aria-hidden />
      <span className="wordmark font-serif leading-none">
        <span className="text-3xl font-normal tracking-[-0.01em] text-[#a8a8a8] md:text-4xl">Cyber</span>
        <span className="text-3xl font-bold tracking-[-0.02em] text-[#f5f5f5] md:text-4xl">Blackmail</span>
      </span>
    </div>
  );
}
