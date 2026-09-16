import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeverityDot } from "@/components/intel/SeverityBadge";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeAlert, localizeArticleRef } from "@/lib/localize";
import { SEVERITY_BG, SEVERITY_TEXT } from "@/lib/severity";
import type { Severity } from "@prisma/client";

type Alert = {
  id: string;
  message: string;
  messageRu?: string | null;
  severity: Severity;
  createdAt: Date | string;
  article?: { slug: string; title: string; titleRu?: string | null } | null;
};

type Trending = {
  slug: string;
  title: string;
  titleRu?: string | null;
  intelligenceScore: number;
  severity: Severity;
};

function Panel({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`${editorial.panel} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-fg">{title}</h3>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export async function HomeSidebar({
  alerts,
  trending,
  mapSlot,
  briefingDate,
}: {
  alerts: Alert[];
  trending: Trending[];
  mapSlot: React.ReactNode;
  briefingDate?: Date | null;
}) {
  const locale = await getLocale();
  const t = await getTranslations("homePage");
  const tSidebar = await getTranslations("sidebar");

  return (
    <aside className="flex flex-col gap-5">
      {mapSlot}

      <Panel
        title={
          <>
            <span className="live-dot" aria-hidden />
            {tSidebar("urgent")}
          </>
        }
        action={
          <Link href="/alerts" className="text-xs font-medium text-fg-3 transition-colors hover:text-fg">
            {tSidebar("allAlerts")} →
          </Link>
        }
      >
        <ul className="relative space-y-4 before:absolute before:bottom-2 before:left-[3.5px] before:top-2 before:w-px before:bg-line">
          {alerts.slice(0, 4).map((raw) => {
            const alert = localizeAlert(raw, locale);
            const body = (
              <>
                <time className="block text-[11px] text-fg-4">
                  {formatRelativeTime(alert.createdAt, locale)}
                </time>
                <p className="mt-1 text-[13.5px] leading-snug text-fg-2 transition-colors group-hover:text-fg">
                  {alert.message}
                </p>
              </>
            );
            return (
              <li key={alert.id} className="group relative pl-5">
                <SeverityDot
                  severity={raw.severity}
                  className="absolute left-0 top-1 ring-4 ring-surface"
                />
                {raw.article?.slug ? <Link href={`/intel/${raw.article.slug}`}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title={t("topThreatsToday")}>
        <ol className="space-y-4">
          {trending.map((raw, i) => {
            const item = localizeArticleRef(raw, locale);
            return (
              <li key={item.slug}>
                <Link href={`/intel/${item.slug}`} className="group flex gap-3.5">
                  <span className="w-6 shrink-0 pt-0.5 font-mono text-sm font-medium text-fg-4 transition-colors group-hover:text-accent-strong">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium leading-snug text-fg-2 transition-colors group-hover:text-fg">
                      {item.title}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={`h-full rounded-full ${SEVERITY_BG[raw.severity]}`}
                          style={{ width: `${Math.min(100, raw.intelligenceScore)}%` }}
                        />
                      </div>
                      <span className={`font-mono text-[11px] tabular-nums ${SEVERITY_TEXT[raw.severity]}`}>
                        {raw.intelligenceScore}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </Panel>

      {briefingDate && (
        <Link
          href="/briefing"
          className="group relative block overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/15 via-surface to-surface p-5 transition-colors hover:border-accent/45"
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <p className={editorial.sectionLabel}>{t("dailyBriefing")}</p>
          <p className="mt-2 flex items-center justify-between gap-3 font-serif text-lg font-semibold text-fg">
            {t("briefingCta")}
            <span className="text-accent-strong transition-transform group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </p>
        </Link>
      )}
    </aside>
  );
}
