"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/constants";
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
  const text = (alert: AlertItem) =>
    locale === "ru" && alert.messageRu ? alert.messageRu : alert.message;

  return (
    <div
      className={cn(
        "border-b border-white/[0.06] bg-[#0c0c0c]",
        className,
      )}
    >
      <div className="mx-auto flex h-10 max-w-7xl items-stretch px-4 lg:px-8">
        <div className="flex shrink-0 items-center border-r border-white/[0.06] pr-4">
          <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#dc2626]">
            {t("breaking")}
          </span>
        </div>
        <div className="relative flex flex-1 items-center overflow-hidden pl-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0c0c0c] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0c0c0c] to-transparent" />
          <div className="ticker-animate flex w-max items-center">
            {items.map((alert, i) => {
              const inner = (
                <span className="inline-flex items-center gap-4 whitespace-nowrap pr-8 text-[13px] text-[#c4c4c4]">
                  {alert.severity === "CRITICAL" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#dc2626]">
                      ●
                    </span>
                  )}
                  {text(alert)}
                </span>
              );
              return alert.article?.slug ? (
                <Link
                  key={`${alert.id}-${i}`}
                  href={`/intel/${alert.article.slug}`}
                  className="transition-colors hover:text-[#fafafa]"
                >
                  {inner}
                </Link>
              ) : (
                <span key={`${alert.id}-${i}`}>{inner}</span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
