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
    fetch("/api/alerts?limit=10")
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
    <div className={cn("overflow-hidden border-b border-[#c41e1e]/20 bg-[#111]", className)}>
      <div className="mx-auto flex h-9 max-w-6xl items-center">
        <span className="shrink-0 bg-[#c41e1e] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white">
          {t("breaking")}
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-animate flex w-max items-center">
            {items.map((alert, i) => {
              const inner = (
                <span className="inline-flex items-center gap-2 whitespace-nowrap px-5 text-xs text-[#d4d4d4]">
                  {text(alert)}
                  <span className="text-[#444]">|</span>
                </span>
              );
              return alert.article?.slug ? (
                <Link key={`${alert.id}-${i}`} href={`/intel/${alert.article.slug}`} className="hover:text-[#e52525]">
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
