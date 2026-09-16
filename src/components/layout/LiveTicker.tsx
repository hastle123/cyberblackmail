"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/constants";
import { decodeHtmlEntities } from "@/lib/article-text";
import { SEVERITY_BG } from "@/lib/severity";
import type { Severity } from "@prisma/client";

type AlertItem = {
  id: string;
  message: string;
  messageRu?: string | null;
  severity: Severity;
  article?: { slug: string } | null;
};

export function LiveTicker({ className }: { className?: string }) {
  const t = useTranslations("ticker");
  const locale = useLocale();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/alerts?limit=12")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.data) setAlerts(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (alerts.length === 0) return null;

  const items = [...alerts, ...alerts];
  const text = (alert: AlertItem) => {
    const raw = locale === "ru" && alert.messageRu ? alert.messageRu : alert.message;
    return decodeHtmlEntities(raw);
  };

  return (
    <div className={cn("border-b border-line bg-surface/50", className)}>
      <div className="mx-auto flex h-10 max-w-7xl items-stretch px-4 lg:px-8">
        <div className="flex shrink-0 items-center gap-2.5 pr-4">
          <span className="live-dot" aria-hidden />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
            {t("breaking")}
          </span>
        </div>
        <div className="ticker-track relative flex flex-1 items-center overflow-hidden border-l border-line pl-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-canvas to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />
          <div className="ticker-animate flex w-max items-center">
            {items.map((alert, i) => {
              const inner = (
                <span className="inline-flex items-center gap-2.5 whitespace-nowrap pr-10 text-[13px] text-fg-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_BG[alert.severity])} aria-hidden />
                  {text(alert)}
                </span>
              );
              return alert.article?.slug ? (
                <Link
                  key={`${alert.id}-${i}`}
                  href={`/intel/${alert.article.slug}`}
                  className="transition-colors hover:text-fg [&>span]:hover:text-fg"
                  tabIndex={i >= alerts.length ? -1 : undefined}
                >
                  {inner}
                </Link>
              ) : (
                <span key={`${alert.id}-${i}`} aria-hidden={i >= alerts.length}>
                  {inner}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
