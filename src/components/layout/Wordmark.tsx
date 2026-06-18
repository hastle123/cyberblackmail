"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/constants";

const TEXT = {
  src: "/brand/masthead-text.png",
  width: 748,
  height: 120,
} as const;

export function MastheadLock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 30" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 0C7.86 0 4.5 3.36 4.5 7.5V11H3.75A2.25 2.25 0 0 0 1.5 13.25v14.5A2.25 2.25 0 0 0 3.75 30h16.5A2.25 2.25 0 0 0 22.5 27.75v-14.5A2.25 2.25 0 0 0 20.25 11H19.5V7.5C19.5 3.36 16.14 0 12 0Zm-4.5 11V7.5a4.5 4.5 0 1 1 9 0V11H7.5Z"
      />
      <path
        fill="#090909"
        d="M12 16.75a2.15 2.15 0 0 0-2.15 2.15v3.35h4.3v-3.35A2.15 2.15 0 0 0 12 16.75Zm0-1.1a3.25 3.25 0 0 1 3.25 3.25v3.35c0 .55-.45 1-1 1h-4.5a1 1 0 0 1-1-1v-3.35a3.25 3.25 0 0 1 3.25-3.25Z"
      />
    </svg>
  );
}

/** Masthead — blackletter text + padlock; Cyber gray, Blackmail light */
export function Wordmark({ className = "", large = false }: { className?: string; large?: boolean }) {
  const t = useTranslations("brand");

  const textH = large ? "h-[24px] sm:h-[26px]" : "h-[19px] sm:h-[20px] md:h-[21px]";
  const lockH = large ? "h-[15px] sm:h-[16px]" : "h-[12.5px] sm:h-[13px] md:h-[14px]";

  return (
    <Link href="/" className={cn("group inline-flex shrink-0 items-center gap-[5px] sm:gap-[6px]", className)}>
      <Image
        src={TEXT.src}
        alt={t("name")}
        width={TEXT.width}
        height={TEXT.height}
        priority
        className={cn(
          "masthead-logo w-auto transition-[filter,opacity] duration-200",
          textH,
        )}
      />
      <MastheadLock
        className={cn(
          "masthead-lock shrink-0 text-[#ebebeb] transition-colors duration-200",
          lockH,
          "w-auto",
        )}
      />
    </Link>
  );
}

export function WordmarkLarge() {
  return <Wordmark large />;
}
