"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand/Logo";
import { cn } from "@/lib/constants";

/** Site logo: CYBER + BLACKMAIL on a red plate */
export function Wordmark({ className = "", large = false }: { className?: string; large?: boolean }) {
  const t = useTranslations("brand");

  return (
    <Link href="/" aria-label={t("name")} className={cn("group inline-flex shrink-0 items-center", className)}>
      <BrandLogo className={large ? "text-[22px]" : "text-[13px] sm:text-[15.5px]"} />
    </Link>
  );
}
