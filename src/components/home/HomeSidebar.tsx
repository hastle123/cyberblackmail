import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeAlert, localizeArticleRef } from "@/lib/localize";
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${editorial.card} overflow-hidden`}>
      <h3 className="border-b border-white/[0.06] bg-[#0f0f0f] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b91c1c]">
        {title}
      </h3>
      <div className="p-4">{children}</div>
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
    <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
      {mapSlot}

      <Panel title={tSidebar("urgent")}>
        <ul className="space-y-4">
          {alerts.slice(0, 4).map((raw) => {
            const alert = localizeAlert(raw, locale);
            return (
              <li key={alert.id} className="border-b border-white/[0.04] pb-4 last:border-0 last:pb-0">
                <time className={`block ${editorial.meta}`}>
                  {formatRelativeTime(alert.createdAt, locale)}
                </time>
                <p className="mt-1.5 text-sm leading-snug text-[#d4d4d4]">{alert.message}</p>
              </li>
            );
          })}
        </ul>
        <Link
          href="/alerts"
          className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8a8a] hover:text-[#dc2626]"
        >
          {tSidebar("allAlerts")} →
        </Link>
      </Panel>

      <Panel title={t("topThreatsToday")}>
        <ol className="space-y-3">
          {trending.map((raw, i) => {
            const item = localizeArticleRef(raw, locale);
            return (
              <li key={item.slug} className="flex gap-3">
                <span className="shrink-0 font-serif text-lg font-bold text-[#404040]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <Link
                    href={`/intel/${item.slug}`}
                    className="text-sm font-medium leading-snug text-[#e5e5e5] hover:text-[#dc2626]"
                  >
                    {item.title}
                  </Link>
                  <p className={`mt-1 ${editorial.meta}`}>
                    {t("intelScore")}: {raw.intelligenceScore}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      {briefingDate && (
        <Link href="/briefing" className={`block ${editorial.card} p-4 transition-colors hover:border-white/[0.1]`}>
          <p className={editorial.sectionLabel}>{t("dailyBriefing")}</p>
          <p className="mt-2 font-serif text-base font-semibold text-[#f0f0f0]">
            {t("briefingCta")}
          </p>
        </Link>
      )}
    </aside>
  );
}
