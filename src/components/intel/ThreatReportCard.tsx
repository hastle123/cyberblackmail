"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatRelativeTime } from "@/lib/constants";
import { cleanFeedSnippet } from "@/lib/article-text";
import { getCategoryCoverFallback, resolveArticleCover } from "@/lib/article-cover";
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
  coverImage,
  className,
}: ThreatReportCardProps) {
  const locale = useLocale();
  const t = useTranslations("category");
  const coverSrc = resolveArticleCover({ coverImage, category, slug });
  const [imgSrc, setImgSrc] = useState(coverSrc);

  useEffect(() => {
    setImgSrc(coverSrc);
  }, [coverSrc]);

  return (
    <article className={`editorial-card overflow-hidden rounded-lg ${className ?? ""}`}>
      <Link href={`/intel/${slug}`} className="group block">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#141414]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            onError={() => setImgSrc(getCategoryCoverFallback(category))}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
            <SeverityBadge severity={severity} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c41e1e]">
              {t(category)}
            </span>
          </div>
        </div>
        <div className="p-4">
          <time className="text-[10px] text-[#6b6b6b]">{formatRelativeTime(publishedAt, locale)}</time>
          <h3 className="mt-2 font-serif text-base font-semibold leading-snug text-[#f0f0f0] group-hover:text-[#e52525]">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-[#a3a3a3]">{cleanFeedSnippet(excerpt)}</p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-[#6b6b6b]">{source}</p>
        </div>
      </Link>
    </article>
  );
}
