"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatRelativeTime } from "@/lib/constants";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import type { Category, Severity } from "@prisma/client";

export type ThreatReportCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  severity: Severity;
  category: Category;
  intelligenceScore: number;
  source: string;
  publishedAt: Date | string;
  coverImage?: string | null;
  className?: string;
};

export function ThreatReportCard({
  slug,
  title,
  excerpt,
  severity,
  category,
  source,
  publishedAt,
  className,
}: ThreatReportCardProps) {
  const locale = useLocale();
  const t = useTranslations("category");

  return (
    <article className={`editorial-card rounded-lg p-4 ${className ?? ""}`}>
      <Link href={`/intel/${slug}`} className="group block">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={severity} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c41e1e]">
            {t(category)}
          </span>
          <time className="text-[10px] text-[#6b6b6b]">{formatRelativeTime(publishedAt, locale)}</time>
        </div>
        <h3 className="font-serif text-base font-semibold leading-snug text-[#f0f0f0] group-hover:text-[#e52525]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-[#a3a3a3]">{excerpt}</p>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-[#6b6b6b]">{source}</p>
      </Link>
    </article>
  );
}
